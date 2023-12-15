import io
import zipfile

import pandas as pd

from src.dal.dalInterfaces.GenericDALInt import GenericDALInt
from src.dal.dalInterfaces.ParamsDALInt import ParamsDALInt
from src.dal.dalInterfaces.TherapyDALInt import TherapyDALInt
from src.exceptions.CustomExceptions import BadRequestException
from src.utils import data
from src.utils.verifications import is_valid_date, is_date_greater, is_patient_ids_input_valid, is_icu_days_input_valid
from src.dal.dalInterfaces.PatientDataDALInt import PatientDataDALInt
from src.dto.DataModels import DataExportReq, DataExportDAL, DataFetchTherapy
from src.services.servicesInterfaces.DataExportServInt import DataExportServInt
from src.utils.logger import get_app_logger


class DataExportServices(DataExportServInt):

    def __init__(self, patient_data_dal: PatientDataDALInt, params_dal: ParamsDALInt, generic_dal: GenericDALInt, therapy_dal: TherapyDALInt):
        self.__patient_data_dal = patient_data_dal
        self.__params_dal = params_dal
        self.__therapy_dal = therapy_dal
        self.__logger = get_app_logger()

        self.__generic_dal = generic_dal
        self.__demography_cols = generic_dal.get_demography().columns.tolist()
        self.__param_cols = generic_dal.get_params()
        self.__daily_param_cols = generic_dal.get_daily_params()

    def export_patient_data_results(self, data_export_req: DataExportReq):
        data_export_dal = DataExportDAL()
        data_therapy = DataFetchTherapy()

        # verify query params logic
        errors = {}

        # verify patient id
        # check if there's IDs
        if data_export_req.patient_ids:

            # remove whitespaces and separate with ';', also removing resulting empty strings
            patient_ids = [input_id for input_id in data_export_req.patient_ids.strip(' ').split(';') if input_id]

            # verify format of IDs
            if not is_patient_ids_input_valid(patient_ids):
                errors['patient_ids'] = 'IDs não possuem o formato correto'
            # if IDs are in the correct format, build data_export_dal
            else:
                patient_ids_interval, patient_ids_single = data.create_patient_ids_objs(patient_ids)
                data_export_dal.patient_ids_interval = patient_ids_interval
                data_export_dal.patient_ids_single = patient_ids_single
                data_therapy.patient_ids_interval = patient_ids_interval
                data_therapy.patient_ids_single = patient_ids_single

        # verify begin date
        if data_export_req.begin_date:
            if not is_valid_date(data_export_req.begin_date):
                errors['begin_date'] = 'Data de início não é válida'
            else:
                data_export_dal.begin_date = data_export_req.begin_date

        # verify end date
        if data_export_req.end_date:
            if not is_valid_date(data_export_req.end_date):
                errors['end_date'] = 'Data de fim não é válida'
            else:
                data_export_dal.end_date = data_export_req.end_date
                data_therapy.end_date = data_export_req.end_date

        if data_export_req.day_uci:
            # remove whitespaces and separate with ';', also removing resulting empty strings
            icu_days = [input_id for input_id in data_export_req.day_uci.strip(' ').split(';') if input_id]

            # verify format of IDs
            if not is_icu_days_input_valid(icu_days):
                errors['day_uci'] = 'IDs não possuem o formato correto'
            # if IDs are in the correct format, build data_export_dal
            else:
                icu_days_interval, icu_days_single = data.create_icu_days_objs(icu_days)
                data_export_dal.icu_days_interval = icu_days_interval
                data_export_dal.icu_days_single = icu_days_single

        # verify res_daily
        if data_export_req.res_daily == 'false':
            data_export_dal.res_daily = False
        elif data_export_req.res_daily == 'true':
            data_export_dal.res_daily = True
        else:
            errors['res_daily'] = 'Valor inválido'

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        # verify if "begin date" is not bigger than "end date"
        if data_export_req.begin_date and data_export_req.end_date:
            if is_date_greater(data_export_req.begin_date, data_export_req.end_date):
                errors['begin_date'] = 'Data de início não é válida'
                errors['end_date'] = 'Data de fim não é válida'

        # verify therapy values
        valid_therapy, ts = self.__is_therapy_valid(data_export_req.therapy)
        if not valid_therapy:
            errors['therapy'] = 'Valores não são válidos'
        else:
            data_therapy.therapy = ts

        # verify demography values
        valid_demography, ds = self.__is_demography_valid(data_export_req.demography)
        if not valid_demography:
            errors['demography'] = 'Valores não são válidos'
        else:
            data_export_dal.demography = ds

        # verify param values
        valid_params, ps = self.__is_params_valid(data_export_req.params, data_export_dal.res_daily)
        if not valid_params:
            errors['param'] = 'Valores não são válidos'
        else:
            data_export_dal.params = ps

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        # only get longitudinal data if there's any params
        data_therapy.longitudinal = len(data_export_dal.params) > 0

        # get patient data only if there's demography or params
        if len(data_export_dal.params) > 0 or len(data_export_dal.demography) > 0:
            df_vals = self.__patient_data_dal.get_export_patient_data(data_export_dal)
            if len(data_export_dal.params) > 0:
                # convert param names
                df_params = self.__params_dal.get_merged_params()
                # transform de id in param to the actual name
                new_cols = data.give_daily_param_names(df_params, data_export_dal.params, self.__logger)
                df_vals = df_vals.rename(columns=new_cols)

                if not data_export_dal.res_daily and not df_vals.empty:
                    df_vals['DT_COLHEITA'] = pd.to_datetime(df_vals['DATA_COLHEITA'].dt.date)
                elif data_export_dal.res_daily:
                    df_vals['DT_COLHEITA'] = pd.to_datetime(df_vals['DT_COLHEITA'])
                else:
                    df_vals['DT_COLHEITA'] = pd.to_datetime(df_vals['DATA_COLHEITA'])
            else:
                # group by patient
                df_vals = df_vals.groupby(['ID_PACIENTE']).first().reset_index()
        else:
            df_vals = None

        # only get therapy if there's therapy
        if len(data_therapy.therapy) > 0:
            df_therapy = self.__therapy_dal.get_therapy_data(data_therapy)
            # create the rest of the table with the missing patients
            if df_vals is None:
                df_patients = self.__generic_dal.get_patients(data_export_dal.patient_ids_interval,
                                                              data_export_dal.patient_ids_single)
            else:
                df_patients = df_vals

            if data_therapy.longitudinal:
                df_therapy = self.__fill_nas(df_therapy, df_patients, index=['ID_PACIENTE', 'DT_COLHEITA'], therapies=data_therapy.therapy)
            else:
                df_therapy = self.__fill_nas(df_therapy, df_patients, index=['ID_PACIENTE'], therapies=data_therapy.therapy)
        else:
            df_therapy = pd.DataFrame()

        # ## join therapy and dl/dcd values
        # check indexes to perform join
        if data_therapy.longitudinal:
            index = ['ID_PACIENTE', 'DT_COLHEITA']
        else:
            index = ['ID_PACIENTE']

        full_df = self.__join_dl_dcd_dt(df_therapy, df_vals, index)

        # remove added DT_COLHEITA for calculations
        if data_therapy.longitudinal and not data_export_dal.res_daily:
            full_df = full_df.drop('DT_COLHEITA', axis=1)

        # ## create excel
        # create buffer with content of the dataframe
        self.__logger.info('Writing to csv...')
        csv = full_df.to_csv(index=False)
        
        # create zip buffer with Excel buffer content
        self.__logger.info('Writing zip buffer...')
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_writer:
            zip_writer.writestr('patient_data.csv', csv)

        # return BytesIO with zip buffer content bytes
        self.__logger.info('Returning zip buffer bytes...')
        return io.BytesIO(zip_buffer.getvalue())

    def __fill_nas(self, df_therapy, df_patients, index, therapies: list):
        # get the existing therapies
        dci_values = df_therapy['DCI'].unique().tolist()

        # rotate the table, so that DCI values will be columns
        patient_data_t = df_therapy.pivot(index=index, columns='DCI', values='VALUE').reset_index()

        # add the missing required therapies from the patients
        missing_therapies = set(therapies).difference(dci_values)
        for missing_therapy in missing_therapies:
            patient_data_t[missing_therapy] = -1

        # retrieve the patients that don't have therapy and their collections
        therapy_patients = patient_data_t['ID_PACIENTE'].unique().tolist()
        non_therapy_patients = df_patients[index]
        if not df_patients.empty:
            non_therapy_patients = non_therapy_patients.set_index('ID_PACIENTE')\
                    .drop(therapy_patients)\
                    .reset_index()

            non_therapy_patients = non_therapy_patients.groupby(index).first().reset_index()

        # add the missing patients, and filling all NA's with -1
        full_therapy_data = pd.concat([patient_data_t, non_therapy_patients]).fillna(-1).reset_index(drop=True)

        return full_therapy_data

    def __is_therapy_valid(self, therapy_req):
        if not therapy_req:
            return True, []

        t = therapy_req.split(',')

        if len(t) == 0:
            return True, []

        therapy_db = self.__generic_dal.get_therapy()['DCI'].tolist()

        return self.__is_contained(t, therapy_db), t

    def __is_demography_valid(self, demography):
        if not demography:
            return True, []

        t = demography.split(',')
        if len(t) == 0:
            return True, []

        return self.__is_contained(t, self.__demography_cols), t

    def __is_params_valid(self, params, res_daily):
        if not params:
            return True, []

        t = params.split(',')
        if len(t) == 0:
            return True, []

        return self.__is_contained(t, self.__daily_param_cols if res_daily else self.__param_cols), t

    def __is_contained(self, l1, l2):
        inner = list(set(l1).intersection(l2))

        return len(inner) == len(l1)

    def __join_dl_dcd_dt(self, df_therapy, df_vals, index: list):
        if df_vals is None:
            return df_therapy

        if df_therapy.empty:
            return df_vals

        # join therapy and DL/DCD data
        therapy_df = df_therapy.set_index(index)
        dl_df = df_vals.set_index(index)
        full_df = dl_df.join(other=therapy_df, on=index, how='inner').reset_index()

        return full_df
