import pandas as pd

from src.dal.dalInterfaces.ParamsDALInt import ParamsDALInt
from src.utils import global_vars


class ParamsDAL(ParamsDALInt):

    def __init__(self, engine):
        self.__engine = engine

    def get_daily_params(self):
        with self.__engine.connect() as conn:
            df_min_max_params = pd.read_sql_query('select * from PATIENT_MIN_MAX_RESULT limit 1;', conn)

        daily_params = df_min_max_params.drop(columns=['ID_PACIENTE', 'DT_COLHEITA']).columns.tolist()

        return daily_params

    def get_merged_params(self, param_ids=None):
        query = f'select ID_MERGED, NM_ANALISE, NM_PARAMETRO, UNIDADES from {global_vars.V_PARAMS_MERGED} '

        if param_ids is None:
            param_ids = []
        else:
            query = query + 'where '

        params = {}
        for idx, param in enumerate(param_ids):
            params[f'pParam{idx}'] = param
            query = query + f'ID_MERGED = %(pParam{idx})s OR '

        if len(param_ids) > 0:
            query = query[:-3]

        with self.__engine.connect() as conn:
            df_params = pd.read_sql_query(sql=query, con=conn, params=params)

        return df_params

    def get_merged_param_name(self, param: str):
        # get param name
        param_parts = param.split('_')
        df_param = self.get_merged_params([param_parts[-1]])
        if len(df_param.index) == 0:
            return None

        param_row = df_param.iloc[0]
        return f'{param_row["NM_PARAMETRO"]} ({" ".join(param_parts[:-1])})'
