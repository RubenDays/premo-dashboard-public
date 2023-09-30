import pandas as pd

from src.utils import global_vars, getters


class CreateFilteredView:
    __prefix = '01_0_create_filtered_view'

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
        params = self.__read_vars_file()
        df = self.__get_param_ids(params)
        self.__create_view(df)
        self.__log_info('Execution completed.')

    # drops the view
    def __drop_view(self):
        with self.__engine.begin() as conn:
            conn.execute(f'drop view if exists {global_vars.V_FILTERED}')

    def __read_vars_file(self):
        with open(f'{global_vars.CONFIGS_BASE}/vars.txt', 'r') as f:
            params = [line.rstrip('\n').split('|') for line in f.readlines()]
        return params

    def __check_vars(self, params):
        self.__log_info('Checking existence of variables in DB...')
        attrs = ['ID_PARAMETRO']
        for nm_analise, nm_parametro in params:
            after_from = f' WHERE (NM_ANALISE="{nm_analise}" AND NM_PARAMETRO="{nm_parametro}");'
            with self.__engine.begin() as conn:
                df = getters.get_from_param(conn, attrs, after_from)
            l = len(df.axes[0])
            if l == 0:
                self.__log_warning(f'"{nm_analise}|{nm_parametro}" has no results!')
            else:
                self.__log_info(f'"{nm_analise}|{nm_parametro}" has {l} results.')

        self.__log_info('Verification of variables complete.')

    # gets the ID_PARAMETRO for the respective selected NM_PARAMETRO
    def __get_param_ids(self, params):

        self.__log_info(f'Retrieving parameters in file from DB...')

        ids_query = "SELECT ID_PARAMETRO, NM_PARAMETRO FROM PARAMETRO WHERE"
        for nm_analise, nm_parametro in params:
            ids_query = ids_query + f' (NM_ANALISE="{nm_analise}" AND NM_PARAMETRO="{nm_parametro}") OR'

        # remove last OR
        ids_query = ids_query[:-2]

        with self.__engine.begin() as conn:
            query_result = pd.read_sql_query(ids_query, conn)

        self.__log_info(f'Retrieved {len(query_result.index)} rows.')

        return query_result

    def __create_view(self, df):
        self.__log_info(f'Creating view query...')

        # dict that has as a key the result table name, and as values the different params
        tables = {}

        self.__log_info(f'Calculating in which result table each param is...')
        for row in df.itertuples():
            row_id = getattr(row, global_vars.COL_PARAMETRO)
            tbl_idx = str(int(row_id / 253) + 1)  # which table RESULTADO
            tbl_name = global_vars.TBL_RESULTADO + tbl_idx

            self.__log_info(f'Param {row_id} is in table {tbl_name}')

            # check is there's already a value in the dict for that table
            table = tables.get(tbl_name)
            if not table:
                table = list()

            table.append(row_id)
            tables[tbl_name] = table

        query = ""

        items = list(tables.items())
        t = len(tables.keys())

        self.__log_info(f'Iterating over every result table to create the query...')
        # Iterate over the map keys, to create the query
        for i in range(len(items)):
            k, v = items[i]
            ids = list()

            # get columns for THIS result table
            query = query + f'(SELECT T{t}.ID_PACIENTE, T{t}.DATA_COLHEITA,'
            for id_param in v:
                formatted_id_param = f'`{id_param}`'
                ids.append(formatted_id_param)

            # get the other columns for the other result tables
            # select from table resulted from join
            for j in range(len(items) - 1, i, -1):
                old_k, old_v = items[j]

                for old_id_param in old_v:
                    formatted_id_param = f'`{old_id_param}`'
                    ids.append(formatted_id_param)

            query = query + ",".join(ids) + f' FROM {k} RIGHT JOIN '

            t = t - 1

        # query = query[:-6]   # remove last join
        query = query[1:]

        # reverse order of keys and convert it to list, so it can be indexed with []
        reversed_keys = list(reversed(tables.keys()))

        t = 1
        query = query + f'(select ID_PACIENTE, DATA_COLHEITA FROM COLHEITA) as T{t} ' \
                        f'on {reversed_keys[0]}.DATA_COLHEITA = T{t}.DATA_COLHEITA AND ' \
                        f'{reversed_keys[0]}.ID_PACIENTE = T{t}.ID_PACIENTE'

        # add the end part of the query (the ON's for the joins)
        t = t + 1
        for i in range(len(reversed_keys)):
            tmp = f'T{t}'
            t = t + 1
            if i + 1 != len(reversed_keys):
                query = query + f') as {tmp} on {reversed_keys[i + 1]}.DATA_COLHEITA = {tmp}.DATA_COLHEITA AND ' \
                                f'{reversed_keys[i + 1]}.ID_PACIENTE = {tmp}.ID_PACIENTE'

        query = f'create view {global_vars.V_FILTERED} as {query}'

        with self.__engine.begin() as conn:
            conn.execute(f'drop view if exists {global_vars.V_FILTERED};')
            conn.execute(query)

        self.__log_info(f'View {global_vars.V_FILTERED} created.')
