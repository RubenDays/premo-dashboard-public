import pandas as pd

from src.dal.dalInterfaces.GenericDALInt import GenericDALInt


class GenericDAL(GenericDALInt):

    def __init__(self, engine):
        self.__engine = engine

    def get_vagas(self):
        query = 'select VAGA from v_patient_data_min_max_result group by VAGA'
        with self.__engine.connect() as conn:
            df_vagas = pd.read_sql_query(sql=query, con=conn)

        return df_vagas

    def get_demography(self):
        query = 'select * from v_patient_data_result_num limit 1;'
        with self.__engine.connect() as conn:
            df_demography = pd.read_sql_query(sql=query, con=conn)

        to_drop = [col for col in list(df_demography.columns.values) if str(col).isnumeric() or 'DATA' in str(col)]
        to_drop.extend(['ID_PACIENTE', 'IDADE', 'DIAS_ALTA_UCI', 'DIAS_ALTA_HOSPITAL', 'DIA_UCI', 'ID_EPISODIO'])
        df_demography = df_demography.drop(columns=to_drop)

        return df_demography

    def get_params(self):
        query = 'select ID_MERGED from v_param_merged;'
        with self.__engine.connect() as conn:
            df_params = pd.read_sql_query(sql=query, con=conn)
        cols = list(map(lambda e: str(e), df_params['ID_MERGED'].tolist()))
        cols.append('IDADE')

        return cols

    def get_daily_params(self):
        with self.__engine.connect() as conn:
            df_min_max_params = pd.read_sql_query('select * from PATIENT_MIN_MAX_RESULT limit 1;', conn)

        daily_params = df_min_max_params.drop(columns=['ID_PACIENTE', 'DT_COLHEITA']).columns.tolist()

        return daily_params

