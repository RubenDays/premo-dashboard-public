import pandas as pd

from src.dal.dalInterfaces.GenericDALInt import GenericDALInt
from src.utils import global_vars
from src.utils.data import create_patients_where_query


class GenericDAL(GenericDALInt):

    def __init__(self, engine):
        self.__engine = engine

    def get_patients(self, patient_ids_interval: list, patient_ids_single: list):
        query = f'select ID_PACIENTE from {global_vars.TBL_EPISODIO} '
        p = {}
        if len(patient_ids_interval) > 0 or len(patient_ids_single) > 0:
            q, p = create_patients_where_query(patient_ids_interval, patient_ids_single)
            query = query + q

        with self.__engine.connect() as conn:
            df = pd.read_sql_query(query, conn, params=p)

        return df

    def get_vagas(self):
        query = f'select VAGA from {global_vars.TBL_EPISODIO} group by VAGA'
        with self.__engine.connect() as conn:
            df_vagas = pd.read_sql_query(sql=query, con=conn)

        return df_vagas

    def get_demography(self):
        query = f'select * from {global_vars.TBL_PATIENT_DATA_RESULT_NUM} limit 1;'
        with self.__engine.connect() as conn:
            df_demography = pd.read_sql_query(sql=query, con=conn)

        to_drop = [col for col in list(df_demography.columns.values) if str(col).isnumeric() or 'DATA' in str(col)]
        to_drop.extend(['ID_PACIENTE', 'IDADE', 'DIAS_ALTA_UCI', 'DIAS_ALTA_HOSPITAL', 'DIA_UCI', 'ID_EPISODIO'])
        df_demography = df_demography.drop(columns=to_drop)

        return df_demography

    def get_params(self):
        query = f'select ID_MERGED from {global_vars.V_PARAMS_MERGED};'
        with self.__engine.connect() as conn:
            df_params = pd.read_sql_query(sql=query, con=conn)
        cols = list(map(lambda e: str(e), df_params['ID_MERGED'].tolist()))
        cols.append('IDADE')
        cols.append('DELIRIUM')
        cols.append('DELIRIUM_BINARIO')
        cols.append('DELIRIUM_COLHEITA')

        return cols

    def get_daily_params(self):
        with self.__engine.connect() as conn:
            df_min_max_params = pd.read_sql_query(f'select * from {global_vars.TBL_PATIENT_MIN_MAX_RESULT} limit 1;', conn)

        daily_params = df_min_max_params.drop(columns=['ID_PACIENTE', 'DT_COLHEITA']).columns.tolist()

        daily_params.append('IDADE')
        daily_params.append('DELIRIUM')
        daily_params.append('DELIRIUM_BINARIO')
        daily_params.append('DELIRIUM_COLHEITA')

        return daily_params

    def get_therapy(self):
        with self.__engine.connect() as conn:
            df_therapy = pd.read_sql_query(f'select DCI from {global_vars.TBL_THERAPY_CROSS_SEC} group by DCI;', conn)

        return df_therapy

