import pandas as pd
import sqlalchemy

from src.utils.MyLogger import MyLogger
from src.utils.connection import get_sqlalchemy_error
from src.utils.funcs import get_patient_id
from src.utils import global_vars


class CreateColsTbl:

    def __init__(self, logger, engine):
        self.__logger = MyLogger(logger=logger, prefix='10_create_cols_tbl')
        self.__engine = engine

    def run(self):
        self.__logger.info('Starting execution...')

        self.__logger.info(f'Retrieving columns from {global_vars.TBL_PATIENT_DATA_RESULT_NUM}...')
        with self.__engine.begin() as conn:
            df_cols = pd.read_sql_query(f'select * from {global_vars.TBL_PATIENT_DATA_RESULT_NUM} limit 1;', conn)

        non_param_cols = [col for col in df_cols.columns.values.tolist() if not str(col).isnumeric()]

        self.__logger.info(f'Creating DF...')
        df = pd.DataFrame({
            'COL_ID': [i for i in range(1, len(non_param_cols) + 1)],
            'COL_NAME': non_param_cols,
            'TYPE': [pd.NA for _ in range(1, len(non_param_cols) + 1)]
        }).set_index('COL_ID')

        self.__logger.info(f'Saving in DB...')
        with self.__engine.begin() as conn:
            df.to_sql(global_vars.TBL_COLS, conn, if_exists='replace', dtype={'COL_ID': sqlalchemy.INT})
            conn.execute(f'ALTER TABLE {global_vars.TBL_COLS} add primary key (`COL_ID`)')

        self.__logger.info('Execution ended.')
