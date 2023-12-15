import pandas as pd
import sqlalchemy

from src.utils import global_vars
from src.utils.getters import get_columns_from_table


class CreateMinMaxResultsTbl:
    __prefix = '07_create_min_max_results_tbl'

    def __init__(self, logger, engine):
        self.__logger = logger
        self.__engine = engine

    def __log_info(self, msg: str):
        self.__logger.info(f'[{self.__prefix}] {msg}')

    def __log_warning(self, msg: str):
        self.__logger.warning(f'[{self.__prefix}] {msg}')

    def __log_error(self, msg: str):
        self.__logger.error(f'[{self.__prefix}] {msg}')

    def run(self):
        self.__log_info('Starting execution...')

        # Gets the columns from v_patient_data_result_num in order to extract that max and mins
        with self.__engine.begin() as conn:
            self.__log_info(f'Retrieving columns from {global_vars.TBL_PATIENT_DATA_RESULT_NUM}...')
            cols = get_columns_from_table(conn, global_vars.TBL_PATIENT_DATA_RESULT_NUM)
        self.__log_info(f'Retrieved {len(cols)} columns.')

        self.__log_info(f'Creating query to create {global_vars.TBL_PATIENT_MIN_MAX_RESULT}...')
        tbl_query, added_cols = self.__create_table_select_query(cols)
        self.__log_info(f'Query created.')

        # sets the data types for SQL columns for the min/max results. Float seems sufficient instead of double
        dtypes = {}
        for added_col in added_cols:
            dtypes[added_col] = sqlalchemy.types.Float

        # also sets the ID_PACIENTE to INT instead of BIGINT
        dtypes['ID_PACIENTE'] = sqlalchemy.types.Integer

        # Queries the DB for the results with min/max and use that result to create the table.
        with self.__engine.begin() as conn:
            self.__log_info(f'Retrieving data to create {global_vars.TBL_PATIENT_MIN_MAX_RESULT}...')
            df = pd.read_sql_query(tbl_query, conn)

            self.__log_info(f'Creating {global_vars.TBL_PATIENT_MIN_MAX_RESULT}...')
            df.to_sql(name=global_vars.TBL_PATIENT_MIN_MAX_RESULT, con=conn, if_exists='replace', dtype=dtypes,
                      index=False)

            self.__log_info(f'Setting primary key for {global_vars.TBL_PATIENT_MIN_MAX_RESULT}...')
            conn.execute(
                f'ALTER TABLE {global_vars.TBL_PATIENT_MIN_MAX_RESULT} ADD PRIMARY KEY (`ID_PACIENTE`, `DT_COLHEITA`);')

        # Creates the view with the min/max results and patient data
        self.__log_info(f'Creating query to create {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT}...')
        view_query = self.__create_view_query(cols, added_cols)
        with self.__engine.begin() as conn:
            self.__log_info(f'Dropping {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT}...')
            conn.execute(f'drop view if exists {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT}')
            self.__log_info(f'Creating {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT}...')
            conn.execute(view_query)

        self.__log_info(f'Execution ended')

    # creates the query to create the table that contains the min and max of the results each day
    # and every morning [7h00 - 11h00].
    # params -> cols: a list that contains all columns of the view with clinical and laboratory data.
    # returns -> query that creates the view
    def __create_table_select_query(self, cols: list):
        # Comments regarding the queries have an arrow (->) indicating the part of the query that will be added
        # in the next string concatenation.

        # get all column params (they are numeric)
        cols_params = [col for col in cols if (str(col).isnumeric())]

        # get the columns that aren't params (they aren't numeric).
        # also excludes DATA_COLHEITA, because it won't be used since we want only the DATE and not DATETIME.
        cols_non_params = []
        for col in cols:
            if col != 'DATA_COLHEITA' and not str(col).isnumeric():
                cols_non_params.append(col)

        # -> select t0.*,
        query = f'select t0.*, '

        manha_min_max_cols = [f'manha_max_{col}, manha_min_{col}' for col in cols_params]

        # select t0.*,
        #  -> manha_max_0, manha_min_0, manha_max_1, manha_min_1, ...
        query = query + ', '.join(manha_min_max_cols)

        # select t0.*, manha_max_0, manha_min_0, manha_max_1, manha_min_1, ...
        #  -> from (
        #  ->   select ID_PACIENTE, SEXO, PAIS_ORIGEM, DATA_ADMISSAO_UCI, ..., cast(DATA_COLHEITA as date) as DT_COLHEITA,
        query = query + ' from (select ID_PACIENTE, cast(DATA_COLHEITA as date) as DT_COLHEITA, '

        dia_cols_query = [f'MAX(`{col}`) as dia_max_{col}, MIN(`{col}`) as dia_min_{col}' for col in cols_params]

        # select t0.*, manha_max_0, manha_min_0, manha_max_1, manha_min_1, ...
        # from (
        #   select ID_PACIENTE, SEXO, PAIS_ORIGEM, DATA_ADMISSAO_UCI, ..., cast(DATA_COLHEITA as date) as DT_COLHEITA,
        # ->    MAX(`0`) as dia_max_0, MIN(`0`) as dia_min_0, MAX(`1`) as dia_max_1, MIN(`1`) as dia_min_1, ...
        # ->	from v_patient_data_result_num
        # ->	where DIA_UCI is not null
        # ->	group by ID_PACIENTE, DT_COLHEITA
        # ->  ) as t0 left join (
        # ->	select ID_PACIENTE, cast(DATA_COLHEITA as date) as DT_COLHEITA,
        query = query + ', '.join(dia_cols_query) + \
                f' from {global_vars.TBL_PATIENT_DATA_RESULT_NUM}' \
                f' where DIA_UCI is not null group by ID_PACIENTE, DT_COLHEITA) as t0' \
                f' left join (select ID_PACIENTE, cast(DATA_COLHEITA as date) as DT_COLHEITA, '

        manha_cols_query = [f'MAX(`{col}`) as manha_max_{col}, MIN(`{col}`) as manha_min_{col}' for col in cols_params]

        # select t0.*, manha_max_0, manha_min_0, manha_max_1, manha_min_1, ...
        # from (
        #   select ID_PACIENTE, SEXO, PAIS_ORIGEM, DATA_ADMISSAO_UCI, ..., cast(DATA_COLHEITA as date) as DT_COLHEITA,
        #    MAX(`0`) as dia_max_0, MIN(`0`) as dia_min_0, MAX(`1`) as dia_max_1, MIN(`1`) as dia_min_1, ...
        # 	from v_patient_data_result_num
        # 	where DIA_UCI is not null
        # 	group by ID_PACIENTE, DT_COLHEITA
        # ) as t0 left join (
        # 	select ID_PACIENTE, cast(DATA_COLHEITA as date) as DT_COLHEITA,
        # ->        MAX(`0`) as manha_max_0, MIN(`0`) as manha_min_0, MAX(`1`) as manha_max_1, MIN(`1`) as manha_min_1, ...
        # ->    from v_patient_data_result_num
        # ->	where DIA_UCI is not null and TIME(DATA_COLHEITA) between "07:00:00" and "11:00:00"
        # ->	group by ID_PACIENTE, DT_COLHEITA
        # -> ) as t1 on t0.ID_PACIENTE = t1.ID_PACIENTE and t0.DT_COLHEITA = t1.DT_COLHEITA
        query = query + ', '.join(
            manha_cols_query) + f' from {global_vars.TBL_PATIENT_DATA_RESULT_NUM} where DIA_UCI is not null' \
                                f' and TIME(DATA_COLHEITA) between "07:00:00" and "11:00:00" group by' \
                                f' ID_PACIENTE, DT_COLHEITA) as t1 on t0.ID_PACIENTE = t1.ID_PACIENTE' \
                                f' and t0.DT_COLHEITA = t1.DT_COLHEITA'

        added_cols = []
        for col in cols_params:
            added_cols.append(f'dia_max_{col}')
            added_cols.append(f'dia_min_{col}')
            added_cols.append(f'manha_max_{col}')
            added_cols.append(f'manha_min_{col}')

        return query, added_cols

    # creates the query to create the view that aggregates patient data with the min/max results
    # params -> patient_data_cols: a list that contains the names of the columns that has the results and patient data
    #        -> added_cols: list of the columns that were added for min/max
    # returns -> query to create view with patient data and min/max results
    def __create_view_query(self, patient_data_cols: list, added_cols: list) -> str:
        patient_data_cols = [col for col in patient_data_cols if not str(col).isnumeric()]
        patient_data_cols.remove('DATA_COLHEITA')
        patient_data_cols.remove('ID_PACIENTE')

        query = f'create view {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT} as select {global_vars.TBL_PATIENT_MIN_MAX_RESULT}.ID_PACIENTE, DT_COLHEITA, {", ".join(patient_data_cols)}, {", ".join(added_cols)} ' \
                f'from {global_vars.TBL_PATIENT_MIN_MAX_RESULT} join {global_vars.TBL_PATIENT_DATA_RESULT_NUM} ' \
                f'on {global_vars.TBL_PATIENT_MIN_MAX_RESULT}.ID_PACIENTE = {global_vars.TBL_PATIENT_DATA_RESULT_NUM}.ID_PACIENTE ' \
                f'and {global_vars.TBL_PATIENT_MIN_MAX_RESULT}.DT_COLHEITA = cast(DATA_COLHEITA as date) group by ID_PACIENTE, DT_COLHEITA ' \
                f'order by {global_vars.TBL_PATIENT_MIN_MAX_RESULT}.ID_PACIENTE asc, {global_vars.TBL_PATIENT_MIN_MAX_RESULT}.DT_COLHEITA asc'

        return query
