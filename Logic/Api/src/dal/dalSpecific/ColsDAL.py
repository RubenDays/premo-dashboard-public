import pandas as pd
import sqlalchemy

from src.dal.dalInterfaces.ColsDALInt import ColsDALInt
from src.dto.DataModels import ChangeColsDal
from src.utils import global_vars


class ColsDAL(ColsDALInt):

    def __init__(self, engine):
        self.__engine = engine

    def change_cols(self, change_cols_dal: ChangeColsDal):
        queries = []

        if len(change_cols_dal.demography) > 0:
            params = {}
            query = f'update {global_vars.TBL_COLS} set TYPE = "d" where '
            for idx, demo in enumerate(change_cols_dal.demography):
                query = query + f'COL_NAME = :pDemo{idx} OR '
                params[f'pDemo{idx}'] = demo
            query = query[:-3]
            queries.append((query, params))

        if len(change_cols_dal.params) > 0:
            query = f'update {global_vars.TBL_COLS} set TYPE = "p" where '
            params = {}
            for idx, param in enumerate(change_cols_dal.params):
                query = query + f'COL_NAME = :pParam{idx} OR '
                params[f'pParam{idx}'] = param
            query = query[:-3]
            queries.append((query, params))

        if len(change_cols_dal.non_selected) > 0:
            query = f'update {global_vars.TBL_COLS} set TYPE = NULL where '
            params = {}
            for idx, value in enumerate(change_cols_dal.non_selected):
                query = query + f'COL_NAME = :pNon{idx} OR '
                params[f'pNon{idx}'] = value
            query = query[:-3]
            queries.append((query, params))

        if len(queries) > 0:
            with self.__engine.begin() as conn:
                for query, params in queries:
                    conn.execute(sqlalchemy.text(query), params)

    def get_cols(self):
        query = f'select COL_NAME, TYPE from {global_vars.TBL_COLS}'

        with self.__engine.begin() as conn:
            df_cols = pd.read_sql_query(sql=query, con=conn)

        return df_cols
