import pandas as pd
from sqlalchemy.future import Engine

from src.dal.dalInterfaces.PatientDataDALInt import PatientDataDALInt
from src.dto.DataModels import DataExportDAL, DataFetchDAL, DataKMFetchDAL, DataLongFetchDAL
from src.utils import global_vars
from src.utils.logger import get_app_logger


class PatientDataDAL(PatientDataDALInt):

    def __init__(self, engine: Engine):
        self.__engine = engine
        self.__logger = get_app_logger()

    def get_patient_data(self, conds: DataExportDAL):

        # Create query depending on values received
        params = {}
        query = 'select * from v_patient_data_min_max_result '
        # query = 'select * from v_patient_data_result_num '

        # build query part for the patient IDs
        if conds.patient_ids_interval or conds.patient_ids_single:
            query = query + f'where ('

            for idx, patient_id in enumerate(conds.patient_ids_single):
                params[f'pPatientIdS{idx}'] = patient_id
                query = query + f' ID_PACIENTE=%(pPatientIdS{idx})s OR'

            for idx, patient_id in enumerate(conds.patient_ids_interval):
                params[f'pPatientIdIl{idx}'] = patient_id['low']
                params[f'pPatientIdIh{idx}'] = patient_id['high']
                query = query + f' (ID_PACIENTE between %(pPatientIdIl{idx})s and %(pPatientIdIh{idx})s) OR'

            query = query[:-2]
            query = query + ') '

        # build query part for the begin date
        if conds.begin_date:
            if len(params) > 0:
                start_q = 'and'
            else:
                start_q = 'where'
            params['pBeginDate'] = conds.begin_date
            query = query + f'{start_q} DT_COLHEITA >= %(pBeginDate)s '

        # build query part for the end date
        if conds.end_date:
            if len(params) > 0:
                start_q = 'and'
            else:
                start_q = 'where'
            params['pEndDate'] = conds.end_date
            query = query + f'{start_q} DT_COLHEITA <= %(pEndDate)s '

        print(query)

        # queries the DB
        with self.__engine.connect() as conn:
            df_vals = pd.read_sql_query(sql=query, con=conn, params=params)

        return df_vals

    def fetch_patient_data(self, data_fetch: DataFetchDAL):
        query, params = self.__build_query_fetch_patient_data(data_fetch)

        with self.__engine.connect() as conn:
            df_res = pd.read_sql_query(sql=query, con=conn, params=params)

        return df_res

    def fetch_long_data(self, data_fetch: DataLongFetchDAL):
        query, params = self.__build_query_fetch_long_patient_data(data_fetch)

        with self.__engine.begin() as conn:
            df = pd.read_sql_query(sql=query, con=conn, params=params)

        return df

    def __build_query_fetch_long_patient_data(self, data_fetch: DataLongFetchDAL):
        params = {}
        query_started = False

        selects = ['ID_PACIENTE', 'DIA_UCI']
        param_cols = [f'`{col}`' for col in data_fetch.params]
        selects.extend(param_cols)

        query = f'select {", ".join(selects)} from '
        if data_fetch.res_daily:
            query = query + f'{global_vars.V_PATIENT_DATA_MIN_MAX_RESULT} '
            date_col_name = 'DT_COLHEITA'
        else:
            query = query + f'v_patient_data_result_num '
            date_col_name = 'DATA_COLHEITA'

        # build query part for the patient IDs
        if data_fetch.patient_ids_interval or data_fetch.patient_ids_single:
            query = query + f'where ('

            for idx, patient_id in enumerate(data_fetch.patient_ids_single):
                params[f'pPatientIdS{idx}'] = patient_id
                query = query + f' ID_PACIENTE=%(pPatientIdS{idx})s OR'

            for idx, patient_id in enumerate(data_fetch.patient_ids_interval):
                params[f'pPatientIdIl{idx}'] = patient_id['low']
                params[f'pPatientIdIh{idx}'] = patient_id['high']
                query = query + f' (ID_PACIENTE between %(pPatientIdIl{idx})s and %(pPatientIdIh{idx})s) OR'

            query_started = True
            query = query[:-2]
            query = query + ') '

        # build query part for the begin date
        if data_fetch.begin_date:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
                query_started = True
            params['pBeginDate'] = data_fetch.begin_date
            query = query + f'{start_q} {date_col_name} >= %(pBeginDate)s '

        # build query part for the end date
        if data_fetch.end_date:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
            params['pEndDate'] = data_fetch.end_date
            query = query + f'{start_q} {date_col_name} <= %(pEndDate)s '

        if query_started:
            start_q = 'and'
        else:
            start_q = 'where'
        query = query + f'{start_q} DIA_UCI is not null and {param_cols[0]} is not null'

        return query, params

    def fetch_km_data(self, data_fetch: DataKMFetchDAL):
        data_fetch.cols.extend(['max(DIA_UCI) as duration', 'OBITO_UCI as event_observed'])
        query, params = self.__build_query_fetch_km_patient_data(data_fetch)
        query = query + f'group by {global_vars.COL_PACIENTE}'

        with self.__engine.begin() as conn:
            df = pd.read_sql_query(sql=query, con=conn, params=params)

        return df

    def __build_query_fetch_km_patient_data(self, data_fetch: DataKMFetchDAL):
        # Create query depending on values received
        params = {}
        query_started = False

        selects = []
        selects.extend(data_fetch.demography)
        selects.extend([f'`{col}`' for col in data_fetch.params])
        selects.extend(data_fetch.cols)

        query = f'select {", ".join(selects)} from {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT} '

        # build query part for the patient IDs
        if data_fetch.patient_ids_interval or data_fetch.patient_ids_single:
            query = query + f'where ('

            for idx, patient_id in enumerate(data_fetch.patient_ids_single):
                params[f'pPatientIdS{idx}'] = patient_id
                query = query + f' ID_PACIENTE=%(pPatientIdS{idx})s OR'

            for idx, patient_id in enumerate(data_fetch.patient_ids_interval):
                params[f'pPatientIdIl{idx}'] = patient_id['low']
                params[f'pPatientIdIh{idx}'] = patient_id['high']
                query = query + f' (ID_PACIENTE between %(pPatientIdIl{idx})s and %(pPatientIdIh{idx})s) OR'

            query_started = True
            query = query[:-2]
            query = query + ') '

        # build query part for the begin date
        if data_fetch.begin_date:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
                query_started = True
            params['pBeginDate'] = data_fetch.begin_date
            query = query + f'{start_q} DT_COLHEITA >= %(pBeginDate)s '

        # build query part for the end date
        if data_fetch.end_date:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
                query_started = True
            params['pEndDate'] = data_fetch.end_date
            query = query + f'{start_q} DT_COLHEITA <= %(pEndDate)s '

        # build query part for vagas
        if len(data_fetch.vagas) > 0:
            if query_started:
                query += 'and'
            else:
                query += 'where'
                query_started = True

            for idx, vaga in enumerate(data_fetch.vagas):
                params[f'pVaga{idx}'] = vaga
                query = query + f' (VAGA = %(pVaga{idx})s) OR '
            query = query[:-3]

        # build query part for covid
        if data_fetch.covid != 2:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
                query_started = True

            params['pCovid'] = data_fetch.covid

            query = query + f'{start_q} (COVID=%(pCovid)s) '

        return query, params

    def fetch_patient_data_nominal(self, data_fetch: DataFetchDAL):
        query, params = self.__build_query_fetch_patient_data(data_fetch)
        query = query + f' group by ID_PACIENTE'

        with self.__engine.connect() as conn:
            df_res = pd.read_sql_query(sql=query, con=conn, params=params)

        return df_res

    def __build_query_fetch_patient_data(self, data_fetch: DataFetchDAL):
        
        # Create query depending on values received
        params = {}
        query_started = False

        selects = data_fetch.demography
        selects.extend([f'`{col}`' for col in data_fetch.params])

        query = f'select {", ".join(selects)} from '
        if data_fetch.res_daily:
            query = query + f'v_patient_data_min_max_result '
            date_col_name = 'DT_COLHEITA'
        else:
            query = query + f'v_patient_data_result_num '
            date_col_name = 'DATA_COLHEITA'

        # build query part for the patient IDs
        if data_fetch.patient_ids_interval or data_fetch.patient_ids_single:
            query = query + f'where ('

            for idx, patient_id in enumerate(data_fetch.patient_ids_single):
                params[f'pPatientIdS{idx}'] = patient_id
                query = query + f' ID_PACIENTE=%(pPatientIdS{idx})s OR'

            for idx, patient_id in enumerate(data_fetch.patient_ids_interval):
                params[f'pPatientIdIl{idx}'] = patient_id['low']
                params[f'pPatientIdIh{idx}'] = patient_id['high']
                query = query + f' (ID_PACIENTE between %(pPatientIdIl{idx})s and %(pPatientIdIh{idx})s) OR'

            query_started = True
            query = query[:-2]
            query = query + ') '

        # build query part for the begin date
        if data_fetch.begin_date:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
                query_started = True
            params['pBeginDate'] = data_fetch.begin_date
            query = query + f'{start_q} {date_col_name} >= %(pBeginDate)s '

        # build query part for the end date
        if data_fetch.end_date:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
                query_started = True
            params['pEndDate'] = data_fetch.end_date
            query = query + f'{start_q} {date_col_name} <= %(pEndDate)s '

        # build query part for the uci day
        if data_fetch.day_uci > 0:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
                query_started = True
            params['pDayUci'] = data_fetch.day_uci
            query = query + f'{start_q} DIA_UCI = %(pDayUci)s '

        # build query part for vagas
        if len(data_fetch.vagas) > 0:
            if query_started:
                query += 'and'
            else:
                query += 'where'
                query_started = True

            for idx, vaga in enumerate(data_fetch.vagas):
                params[f'pVaga{idx}'] = vaga
                query = query + f' (VAGA = %(pVaga{idx})s) OR '
            query = query[:-3]

        # build query part for covid
        if data_fetch.covid != 2:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
                query_started = True

            params['pCovid'] = data_fetch.covid

            query = query + f'{start_q} (COVID=%(pCovid)s) '

        # build query part for uci
        if data_fetch.uci != 2:
            if query_started:
                start_q = 'and'
            else:
                start_q = 'where'
                query_started = True

            if data_fetch.uci == 0:
                q = 'IS NULL'
            else:
                q = 'IS NOT NULL'

            query = query + f'{start_q} (DIA_UCI {q}) '

        return query, params

    def get_columns(self):
        query = 'select * from v_patient_data_result_num limit 1'

        with self.__engine.connect() as conn:
            df_params = pd.read_sql_query(sql=query, con=conn)

        return df_params.columns.values

    def get_enum_columns(self):
        return {
            'VACINA': 'VACINA',
            'PAIS_ORIGEM': 'PAIS',
            'MOTIVO_ADMISSAO': 'MOTIVO_ADMISSAO'
        }

    def get_enum_values(self, tbl):
        query = f'select * from {tbl}'

        with self.__engine.connect() as conn:
            df_enum_col_vals = pd.read_sql_query(sql=query, con=conn)

        # labels, display_labels
        return \
            df_enum_col_vals[df_enum_col_vals.columns[0]].tolist(),\
            df_enum_col_vals[df_enum_col_vals.columns[1]].tolist()
