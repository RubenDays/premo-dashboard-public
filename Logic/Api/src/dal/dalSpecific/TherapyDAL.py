# Class that represents DAL for queries related to therapy.
from sqlalchemy.future import Engine
import pandas as pd

from src.dal.dalInterfaces.TherapyDALInt import TherapyDALInt
from src.dto.DataModels import DataFetchTherapy
from src.utils import global_vars
from src.utils.data import create_patients_where_query


class TherapyDAL(TherapyDALInt):

    def __init__(self, engine: Engine):
        self.__engine = engine

    def get_therapy_data(self, data_fetch_therapy: DataFetchTherapy):
        if data_fetch_therapy.longitudinal:
            selects = ['ID_PACIENTE', 'DT_COLHEITA', 'DCI', 'VALUE']
        else:
            selects = ['ID_PACIENTE', 'DCI', 'VALUE']

        query = f'select {",".join(selects)} from ' \
                f'{global_vars.TBL_THERAPY_LONG if data_fetch_therapy.longitudinal else global_vars.TBL_THERAPY_CROSS_SEC} '
        params = {}

        # ## where query
        # build query part for the patient IDs
        if data_fetch_therapy.patient_ids_interval or data_fetch_therapy.patient_ids_single:
            q, p = create_patients_where_query(data_fetch_therapy.patient_ids_interval, data_fetch_therapy.patient_ids_single)
            query = query + q
            params = p

        if data_fetch_therapy.longitudinal:
            # build query part for the begin date
            if data_fetch_therapy.begin_date:
                if len(params) > 0:
                    start_q = 'and'
                else:
                    start_q = 'where'
                params['pBeginDate'] = data_fetch_therapy.begin_date
                query = query + f'{start_q} DT_COLHEITA >= %(pBeginDate)s '

            # build query part for the end date
            if data_fetch_therapy.end_date:
                if len(params) > 0:
                    start_q = 'and'
                else:
                    start_q = 'where'
                params['pEndDate'] = data_fetch_therapy.end_date
                query = query + f'{start_q} DT_COLHEITA <= %(pEndDate)s '

        # build query part for therapy (DCI)
        if len(params) > 0:
            query = query + 'and ('
        else:
            query = query + 'where ('
        for idx, dci in enumerate(data_fetch_therapy.therapy):
            params[f'pDCI{idx}'] = dci
            query = query + f' DCI=%(pDCI{idx})s OR'

        query = query[:-2]  # delete last OR
        query = query + ') '  # close parentheses

        # queries the DB
        with self.__engine.connect() as conn:
            df_therapy = pd.read_sql_query(sql=query, con=conn, params=params)

        return df_therapy
