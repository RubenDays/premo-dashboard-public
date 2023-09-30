import pandas as pd
import sqlalchemy

from src.utils import getters, global_vars


class CreateMergedParams:

    __prefix = '03_create_merged_params'

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
        self.__log_info('Getting parameters from view...')
        df_filtered_params = getters.get_filtered_params(self.__engine,
                                                         [global_vars.COL_PARAMETRO, 'NM_ANALISE', 'NM_PARAMETRO',
                                                          'UNIDADES'])
        self.__log_info(f'Retrieved {len(df_filtered_params.axes[0])} parameters.')

        df_merged_ids = self.__merge_param_ids(df_filtered_params)

        self.__log_info('Writing to DB...')
        with self.__engine.begin() as conn:
            df_merged_ids.to_sql(global_vars.TBL_MERGED_IDS_PARAMS, index=False,
                                 dtype={global_vars.COL_PARAMETRO: sqlalchemy.types.Integer,
                                        "ID_MERGED": sqlalchemy.types.Integer},
                                 con=conn, if_exists='replace')
            self.__log_info('Writing to DB complete.')

            self.__log_info(f'Adding primary key to {global_vars.TBL_MERGED_IDS_PARAMS}...')
            conn.execute(
                f'alter table `{global_vars.TBL_MERGED_IDS_PARAMS}` add primary key(`{global_vars.COL_PARAMETRO}`);')

        self.__log_info('Execution completed.')

    def __merge_param_ids(self, df_params):
        self.__log_info('Starting parameters merge...')

        grouped_params = {}
        for row in df_params.itertuples():
            key = f'{row.NM_ANALISE}|{row.NM_PARAMETRO}|{row.UNIDADES}'
            if key in grouped_params.keys():
                l = grouped_params[key]
                l.append(row.ID_PARAMETRO)
            else:
                l = [row.ID_PARAMETRO]
                grouped_params[key] = l

        merged_ids = {
            'ID_PARAMETRO': [],
            'ID_MERGED': []
        }
        id_merged = 0
        for k, v in grouped_params.items():
            for id_param in v:
                merged_ids['ID_PARAMETRO'].append(id_param)
                merged_ids['ID_MERGED'].append(id_merged)

            id_merged = id_merged + 1

        df_merged = pd.DataFrame(merged_ids)

        self.__log_info(f'Parameters merge complete. {len(df_params.axes[0])} parameters condensed to {id_merged}.')
        return df_merged

    def __get_param_columns(self, df_v_filtered):
        param_columns = [v for v in df_v_filtered.columns if str(v).isnumeric()]
        query = 'where'
        for column in param_columns:
            query = query + f' {global_vars.COL_PARAMETRO}={column} OR'

        return query[:-3]
