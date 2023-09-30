from src.utils import getters, merge, global_vars


class AgregCatValues:

    __prefix = '04_agreg_cat_values'

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
            cat_params = [int(col) for col in getters.get_columns_from_table(conn, global_vars.TBL_CAT_VALUES) if
                          str(col).isnumeric()]

        #   may be required to drop some merged_params columns, because there might be params without val_ref, which
        # cannot be categorized.
        for idx, val in df_merged_ids.iterrows():
            id_param = val['ID_PARAMETRO']
            if id_param not in cat_params:
                self.__log_info(f'ID_PARAMETRO {id_param} will be dropped, as categorization doesn\'t apply.')
                df_merged_ids = df_merged_ids.drop([idx])

        self.__log_info(f'Retrieved {len(df_merged_ids.axes[0])} rows.')

        self.__create_cat_merged_view(df_merged_ids)

        self.__log_info('Execution completed.')

    # creates the categorized merged values
    # attempts to drop existing view before creating.
    def __create_cat_merged_view(self, df_merged_ids):

        self.__log_info('Creating merged categoric view...')
        merge_query = merge.merge_values(df_merged_ids, merge.MergeTable.CATEGORIC)
        self.__log_info('Merged categoric view created.')

        self.__log_info(f'Dropping {global_vars.V_AGREG_CAT_VALUES}...')

        with self.__engine.begin() as conn:
            conn.execute(f'drop view if exists {global_vars.V_AGREG_CAT_VALUES}')

            self.__log_info(f'Creating {global_vars.V_AGREG_CAT_VALUES}...')
            conn.execute(f'create view {global_vars.V_AGREG_CAT_VALUES} as {merge_query}')


