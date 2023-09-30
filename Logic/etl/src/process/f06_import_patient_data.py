from zipfile import ZipFile
import pandas as pd

from src.utils import global_vars


class ImportPatientData:

    __prefix = '06_import_patient_data'

    def __init__(self, logger, engine, archived_data: ZipFile):
        self.__logger = logger
        self.__engine = engine
        self.__data = archived_data

    def __log_info(self, msg: str):
        self.__logger.info(f'[{self.__prefix}] {msg}')

    def __log_warning(self, msg: str):
        self.__logger.warning(f'[{self.__prefix}] {msg}')

    def __log_error(self, msg: str):
        self.__logger.error(f'[{self.__prefix}] {msg}')

    def run(self):
        self.__log_info('Starting execution...')

        filename = self.__get_patient_data_file()

        if filename is not None and len(filename) > 0:
            self.__log_info('Data is present - importing...')
            file_bytes = self.__data.read(filename[0])

            df_all_data = pd.read_excel(file_bytes)

            # PROCESSO is done separately, because it will only append the new patients and ignore the duplicates
            with self.__engine.begin() as conn:
                # get the next ID_EPISODIO
                max_eps = self.__get_max_id_episodio(conn)
                # generate new id episodio for new entries
                df_all_data['ID_EPISODIO'] = df_all_data.index + max_eps
                # get the column names
                all_cols = list(df_all_data.columns.values)

                tbl_processo, processo_cols = self.__get_extract_cols(global_vars.TBL_PROCESSO, all_cols, conn)

            # must be in order of insertion because of constraints
            # tables = ['EPISODIO', 'VMI', 'ECMO', 'COMORBIDADE']
            tables = [global_vars.TBL_EPISODIO, global_vars.TBL_VMI, global_vars.TBL_ECMO, global_vars.TBL_COMORB]
            with self.__engine.begin() as conn:
                self.__insert_processo(df_all_data[processo_cols], conn)  # insert data for PROCESSO
                # get the columns to extra from the file for each of the tables
                table_ins_info = [self.__get_extract_cols(tbl_name, all_cols, conn) for tbl_name in tables]
                tables.reverse()  # reverse order to delete because of constraints
                for tbl in tables:
                    self.__delete_data(tbl, conn)
                for tbl_name, tbl_cols in table_ins_info:
                    self.__insert_data(tbl_name, df_all_data[tbl_cols], conn)

            table_ins_info.insert(0, (tbl_processo, processo_cols))

            self.__create_patient_data_view(table_ins_info)
        else:
            self.__log_info('Patient data is not present - skip import patient data.')

        self.__log_info('Creating patient data view with results...')
        with self.__engine.begin() as conn:
            # it's categorical view, but could be the numeric one. all that's needed are the columns.
            df = pd.read_sql_query(f'select * from {global_vars.V_AGREG_CAT_VALUES} limit 1', conn)

        agreg_cols = [str(col) for col in df.columns if str(col).isnumeric()]

        with self.__engine.begin() as conn:
            self.__create_patient_data_result_views(agreg_cols, conn)

        self.__log_info('Execution completed.')

    # Gets the columns of a given table. Returns tuple[table_name, list of columns]
    # params:
    #   table_name -> name of the table.
    #   conn -> connection to the DB.
    def __get_extract_cols(self, table_name: str, all_cols: list, conn) -> tuple:
        df = pd.read_sql_query(sql=f'select * from {table_name} limit 1', con=conn)
        df_cols = list(df.columns.values)

        # get only the columns that are present in both the DB and the file
        present_cols = [col for col in df_cols if col in all_cols]

        return table_name, present_cols

    # Clears data from the given table name.
    # params:
    #   table -> name of the table.
    def __delete_data(self, table, con):
        self.__log_info(f'Deleting data from {table}...')
        con.execute(f'delete from {table};')

    # Inserts given data to the given table. Data will append to existing one, it's advised to clear existing data first.
    # Also removes any null tuples (excluding the key).
    # params:
    #   tbl_name -> name of the table.
    #   data -> dataframe with the data to be inserted.
    #   conn -> connection to DB.
    def __insert_data(self, tbl_name: str, data: pd.DataFrame, conn):
        # d = data.set_index([global_vars.COL_PACIENTE, global_vars.COL_EPISODIO]).dropna(how='all').reset_index()
        d = data.set_index(['ID_EPISODIO']).dropna(how='all').reset_index()
        self.__log_info(f'Inserting data to {tbl_name}...')
        d.to_sql(tbl_name, index=False, con=conn, if_exists='append')

    # This creates a view similar to the Excel file
    def __create_patient_data_view(self, tables_ins_info):
        self.__log_info(f'Generating {global_vars.V_PATIENT_DATA}...')
        query = f'create view {global_vars.V_PATIENT_DATA} as '

        t = len(tables_ins_info) - 1    # number of intermediate tables in query

        # so it starts with the last one. Most important one is PACIENTE which needs to be the last one
        tables_ins_info.reverse()
        for tbl_name, cols in tables_ins_info:
            if tbl_name == global_vars.TBL_PROCESSO:
                query = query + f'select {", ".join(cols)} from {tbl_name}'
            elif tbl_name == global_vars.TBL_EPISODIO:
                cols.remove(global_vars.COL_PACIENTE)
                query = query + f'select t{t}.*, {", ".join(cols)} from {tbl_name} right join ( '
            else:
                # cols.remove(global_vars.COL_PACIENTE)
                # cols.remove(global_vars.COL_EPISODIO)
                cols.remove('ID_EPISODIO')
                query = query + f'select t{t}.*, {", ".join(cols)} from {tbl_name} right join ( '

            t = t - 1

        t = 1

        # reverse again to finish the query with the ") as tx on ..."
        tables_ins_info.reverse()
        for i in range(len(tables_ins_info) - 1):
            tbl_name, cols = tables_ins_info[i+1]
            if tbl_name == global_vars.TBL_EPISODIO:
                query = query + f') as t{t} on t{t}.{global_vars.COL_PACIENTE} = {tbl_name}.{global_vars.COL_PACIENTE}'
            else:
                query = query + f') as t{t} on t{t}.ID_EPISODIO = {tbl_name}.ID_EPISODIO '
            t = t + 1

        with self.__engine.begin() as conn:
            conn.execute(f'drop view if exists {global_vars.V_PATIENT_DATA}')
            conn.execute(query)

    # Creates a view with the given create_view_name
    # params:
    #   cols -> list of column names that represent the parameters of the results. Each column must be in ``.
    #   from_view_name -> Name of the view which to agregate.
    #   create_view_name -> Name of the view to be created.
    def __create_patient_data_result_view_aux(self, cols: list, from_view_name: str, create_view_name: str, conn):
        # Basically consists in joining the data from v_patient_data and v_agreg_cat/num_values, so we get a longitudinal
        # table with results and patient info.
        # Also adds columns to check if at the time of DATA_COLHEITA the patient was using VMI or ECMO, also a column that
        # shows how many days, from the DATA_COLHEITA, until death.
        query = f'create view {create_view_name} as ' \
            f'select {global_vars.V_PATIENT_DATA}.*, datediff(DATA_ALTA_UCI, {global_vars.COL_COLHEITA}) as DIAS_ALTA_UCI, ' \
                f'datediff(DATA_ALTA_HOSPITAL, {global_vars.COL_COLHEITA}) as DIAS_ALTA_HOSPITAL, ' \
                f'case when {global_vars.COL_COLHEITA} between DATA_ADMISSAO_UCI and DATA_ALTA_UCI then (datediff({global_vars.COL_COLHEITA}, DATA_ADMISSAO_UCI) + 1) else null end as DIA_UCI, ' \
                f'{global_vars.COL_COLHEITA}, ' \
                f'case when ({global_vars.COL_COLHEITA} between `DATA_INICIO_VMI` and `DATA_FIM_VMI`) then 1 else 0 end as VMI, ' \
                f'case when ({global_vars.COL_COLHEITA} between `DATA_INICIO_ECMO` and `DATA_FIM_ECMO`) then 1 else 0 end as ECMO, ' \
                f'{", ".join(cols)} ' \
            f'from {global_vars.V_PATIENT_DATA} join {from_view_name} ' \
                f'on {global_vars.V_PATIENT_DATA}.{global_vars.COL_PACIENTE} = {from_view_name}.{global_vars.COL_PACIENTE} '

        conn.execute(f'drop view if exists {create_view_name};')
        conn.execute(query)

    # Creates v_patient_data_result_cat and v_patient_data_result_num.
    # params:
    #   result_cols -> list of column names that represent the parameters of the results
    #   conn -> connection
    def __create_patient_data_result_views(self, result_cols: list, conn):
        cols = [f'`{col}`' for col in result_cols]
        self.__log_info(f'Creating {global_vars.V_PATIENT_DATA_RESULT_CAT}...')
        self.__create_patient_data_result_view_aux(cols, global_vars.V_AGREG_CAT_VALUES, global_vars.V_PATIENT_DATA_RESULT_CAT, conn)

        self.__log_info(f'Creating {global_vars.V_PATIENT_DATA_RESULT_NUM}...')
        self.__create_patient_data_result_view_aux(cols, global_vars.V_AGREG_NUM_VALUES, global_vars.V_PATIENT_DATA_RESULT_NUM, conn)

    def __insert_processo(self, df_ins_processo, conn):
        df_keys = pd.read_sql_query(f'select ID_PACIENTE from {global_vars.TBL_PROCESSO};', conn)
        df_ins = df_ins_processo.drop_duplicates(subset=['ID_PACIENTE'], keep='first')

        existing_idx = df_keys.set_index(global_vars.COL_PACIENTE).index
        to_ins_idx = df_ins.set_index(global_vars.COL_PACIENTE).index

        mask = ~to_ins_idx.isin(existing_idx)
        df_3 = df_ins.loc[mask]     # removes existing ID_PACIENTE from df that already exists in DB

        df_3.to_sql(global_vars.TBL_PROCESSO, index=False, con=conn, if_exists='append')

    def __get_max_id_episodio(self, conn):
        df = pd.read_sql_query(sql=f'select MAX(ID_EPISODIO) as max_eps from EPISODIO', con=conn)
        max_eps = df['max_eps'].iloc[0]

        return max_eps + 1 if max_eps else 1

    def __get_patient_data_file(self):

        def is_patient_data_file(f):
            return f.split('/')[0] == 'patient_data'

        return [f for f in self.__data.namelist() if is_patient_data_file(f)]
