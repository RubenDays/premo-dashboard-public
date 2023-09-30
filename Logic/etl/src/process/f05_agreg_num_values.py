from src.utils import merge, getters, global_vars


class AgregNumValues:

    __prefix = '05_agreg_num_values'

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

        self.__log_info('Getting merged parameter values...')
        with self.__engine.begin() as conn:
            df_merged_ids = getters.get_merged_ids(conn)
        self.__log_info(f'Retrieved {len(df_merged_ids.axes[0])} rows.')

        self.__create_num_merged_table(df_merged_ids)

        self.__log_info('Execution completed.')

    # creates the numeric merged values.
    # attempts to drop existing view before creating.
    def __create_num_merged_table(self, df_merged_ids):
        self.__log_info('Creating merged numeric view...')
        merge_query = merge.merge_values(df_merged_ids, merge.MergeTable.NUMERIC)
        self.__log_info('Merged numeric view created.')

        self.__log_info(f'Dropping {global_vars.V_AGREG_NUM_VALUES}...')
        with self.__engine.begin() as conn:
            conn.execute(f'drop view if exists {global_vars.V_AGREG_NUM_VALUES}')
            self.__log_info(f'Creating {global_vars.V_AGREG_NUM_VALUES}...')
            conn.execute(f'create view {global_vars.V_AGREG_NUM_VALUES} as {merge_query}')


