import pandas as pd
import sys
import sqlalchemy

from src.utils import connection
from src.utils import global_vars
from src.utils import funcs


class ImportDelirium:

    __prefix = '06-0_import_delirium'

    def __init__(self, logger, engine, archived_data):
        self.__logger = logger
        self.__engine = engine
        self.__archived_data = archived_data

    def __log_info(self, msg: str):
        self.__logger.info(f'[{self.__prefix}] {msg}')

    def __log_warning(self, msg: str):
        self.__logger.warning(f'[{self.__prefix}] {msg}')

    def __log_error(self, msg: str):
        self.__logger.error(f'[{self.__prefix}] {msg}')

    def run(self):
        self.__log_info(f'Starting execution...')
        # retrieves the name of the file
        filename = self.__get_data_file()

        # ignores if empty
        if not filename or len(filename) == 0:
            self.__log_info(f'File not found. Ignoring phase...')

        # gets the file's bytes
        self.__log_info(f'File {filename} found. Processing...')
        file_bytes = self.__archived_data.read(filename[0])

        # read the excel file to a dataframe
        self.__log_info(f'Reading excel to DF...')
        df_delirium = pd.read_excel(file_bytes)

        index = ['ID_PACIENTE', 'DATA_COLHEITA']

        # select only the subset of columns that are required
        df_delirium = df_delirium[['ID_PACIENTE', 'DATA_COLHEITA', 'DELIRIUM', 'DELIRIUM_BINARIO', 'DELIRIUM_COLHEITA']]\
            .set_index(index)

        engine = connection.get_engine()
        self.__log_info(f'Retrieving data from DB...')
        # retrieve data from the numeric and categorical tables (they may have different data)
        with engine.connect() as conn:
            df_data_num = pd.read_sql_query(f'select * from {global_vars.TBL_PATIENT_DATA_RESULT_NUM}', conn).set_index(index)
            df_data_cat = pd.read_sql_query(f'select * from {global_vars.TBL_PATIENT_DATA_RESULT_CAT}', conn).set_index(index)

        self.__log_info(f'Joining file data with db...')
        # join the delirium data with the existing one
        new_df_num = df_data_num.join(df_delirium, on=['ID_PACIENTE', 'DATA_COLHEITA']).reset_index()
        new_df_cat = df_data_cat.join(df_delirium, on=['ID_PACIENTE', 'DATA_COLHEITA']).reset_index()

        self.__log_info(f'Writing results to db...')
        # writes the resultsing df's back to the DB, in batches.
        with engine.begin() as conn:
            num_types = funcs.transform_tbl_big_ints_to_ints(new_df_num)
            funcs.write_to_db_batches(conn, new_df_num, global_vars.TBL_PATIENT_DATA_RESULT_NUM, self.__logger, types=num_types)
            
            cat_types = funcs.transform_tbl_big_ints_to_ints(new_df_cat)
            funcs.write_to_db_batches(conn, new_df_cat, global_vars.TBL_PATIENT_DATA_RESULT_CAT, self.__logger, types=cat_types)
            
        self.__log_info(f'Execution completed.')

    def __get_data_file(self):

        def is_delirium_file(f):
            f_parts = f.split('/')
            return f_parts[0] == 'delirium_data' and len(f_parts) == 2 and len(f_parts[1]) > 0

        return [f for f in self.__archived_data.namelist() if is_delirium_file(f)]
