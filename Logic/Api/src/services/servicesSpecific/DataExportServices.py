import io
import zipfile

from src.dal.dalInterfaces.ParamsDALInt import ParamsDALInt
from src.exceptions.CustomExceptions import BadRequestException
from src.utils import data
from src.utils.verifications import is_valid_date, is_date_greater, is_patient_ids_input_valid
from src.dal.dalInterfaces.PatientDataDALInt import PatientDataDALInt
from src.dto.DataModels import DataExportReq, DataExportDAL
from src.services.servicesInterfaces.DataExportServInt import DataExportServInt
from src.utils.logger import get_app_logger


class DataExportServices(DataExportServInt):

    def __init__(self, patient_data_dal: PatientDataDALInt, params_dal: ParamsDALInt):
        self.__patient_data_dal = patient_data_dal
        self.__params_dal = params_dal
        self.__logger = get_app_logger()

    def export_patient_data_results(self, data_export_req: DataExportReq):
        data_export_dal = DataExportDAL()

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

        # verify if "begin date" is not bigger than "end date"
        if data_export_req.begin_date and data_export_req.end_date:
            if is_date_greater(data_export_req.begin_date, data_export_req.end_date):
                errors['begin_date'] = 'Data de início não é válida'
                errors['end_date'] = 'Data de fim não é válida'

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        # get patient data
        df_vals = self.__patient_data_dal.get_patient_data(data_export_dal)

        # get merged params and daily params
        df_params = self.__params_dal.get_merged_params()
        daily_params_cols = self.__params_dal.get_daily_params()

        # transform de id in daily param to the actual name
        new_cols = data.give_daily_param_names(df_params, daily_params_cols, self.__logger)

        df_vals = df_vals.rename(columns=new_cols)

        # create excel buffer with content of dataframe
        self.__logger.info('Writing to csv...')
        csv = df_vals.to_csv(index=False)
        
        # create zip buffer with Excel buffer content
        self.__logger.info('Writing zip buffer...')
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_writer:
            zip_writer.writestr('patient_data.csv', csv)

        # return BytesIO with zip buffer content bytes
        self.__logger.info('Returning zip buffer bytes...')
        return io.BytesIO(zip_buffer.getvalue())
