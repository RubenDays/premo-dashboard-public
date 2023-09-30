import sqlalchemy
import pandas as pd
from sqlalchemy.future import Engine

from . import global_vars
from src.utils.singleton import singleton
from src.utils.logger import get_app_logger


@singleton
class EngineHelper:

    def __init__(self, url):
        self.__engine = sqlalchemy.create_engine(url, echo=False, pool_pre_ping=True)
        self.__logger = get_app_logger()

    def get_engine(self) -> Engine:
        return self.__engine
        
    def test_connection(self):
        self.__logger.info(f'Testing connection to DB (might take few seconds) ...')
        with self.__engine.connect() as conn:
            pd.read_sql_query(sql="select 1;", con=conn)
            # conn.execute('select 1;')

        self.__logger.info(f'Connection OK.')


def create_default_engine_helper():
    return EngineHelper(f"mariadb+mariadbconnector://%s" % global_vars.CONNECTION_STRING)
