from src.dto.DataModels import DataKMFetchReq, DataKMFetchDAL, DataLongFetchDAL, DataLongFetchReq
from src.exceptions.CustomExceptions import BadRequestException
from src.utils.verifications import is_interval, is_patient_ids_input_valid, is_valid_date, is_date_greater, \
    is_positive_number, is_number
from . import global_vars


# Verification of line selectors for longitudinal form (param evolution)
def verify_long_line_selectors(data_fetch_req: DataLongFetchReq):
    errors = {}
    data_fetch_dal = DataLongFetchDAL()

    # verify patient id
    # check if there's IDs
    if data_fetch_req.patient_ids:

        # remove whitespaces and separate with ';', also removing resulting empty strings
        patient_ids = [input_id for input_id in data_fetch_req.patient_ids.strip(' ').split(';') if input_id]

        # verify format of IDs
        if not is_patient_ids_input_valid(patient_ids):
            errors['patient_ids'] = 'IDs não possuem o formato correto'
        # if IDs are in the correct format, build data_export_dal
        else:
            patient_ids_interval, patient_ids_single = create_patient_ids_objs(patient_ids)
            data_fetch_dal.patient_ids_interval = patient_ids_interval
            data_fetch_dal.patient_ids_single = patient_ids_single

    # verify begin date
    if data_fetch_req.begin_date:
        if not is_valid_date(data_fetch_req.begin_date):
            errors['begin_date'] = 'Data de início não é válida'
        else:
            data_fetch_dal.begin_date = data_fetch_req.begin_date

    # verify end date
    if data_fetch_req.end_date:
        if not is_valid_date(data_fetch_req.end_date):
            errors['end_date'] = 'Data de fim não é válida'
        else:
            data_fetch_dal.end_date = data_fetch_req.end_date

    # verify if "begin date" is not bigger than "end date"
    if data_fetch_req.begin_date and data_fetch_req.end_date:
        if is_date_greater(data_fetch_req.begin_date, data_fetch_req.end_date):
            errors['begin_date'] = 'Data de início não é válida'
            errors['end_date'] = 'Data de fim não é válida'

    if data_fetch_req.res_daily:
        if data_fetch_req.res_daily == 'false':
            data_fetch_dal.res_daily = False
        elif data_fetch_req.res_daily == 'true':
            data_fetch_dal.res_daily = True
        else:
            errors['res_daily'] = 'Valor inválido'

    return data_fetch_dal, errors


# Verification of line selectors for survival curves form
def verify_km_line_selectors(data_fetch_req: DataKMFetchReq):
    errors = {}
    data_fetch_dal = DataKMFetchDAL()

    # verify patient id
    # check if there's IDs
    if data_fetch_req.patient_ids:

        # remove whitespaces and separate with ';', also removing resulting empty strings
        patient_ids = [input_id for input_id in data_fetch_req.patient_ids.strip(' ').split(';') if input_id]

        # verify format of IDs
        if not is_patient_ids_input_valid(patient_ids):
            errors['patient_ids'] = 'IDs não possuem o formato correto'
        # if IDs are in the correct format, build data_export_dal
        else:
            patient_ids_interval, patient_ids_single = create_patient_ids_objs(patient_ids)
            data_fetch_dal.patient_ids_interval = patient_ids_interval
            data_fetch_dal.patient_ids_single = patient_ids_single

    # verify begin date
    if data_fetch_req.begin_date:
        if not is_valid_date(data_fetch_req.begin_date):
            errors['begin_date'] = 'Data de início não é válida'
        else:
            data_fetch_dal.begin_date = data_fetch_req.begin_date

    # verify end date
    if data_fetch_req.end_date:
        if not is_valid_date(data_fetch_req.end_date):
            errors['end_date'] = 'Data de fim não é válida'
        else:
            data_fetch_dal.end_date = data_fetch_req.end_date

    # verify if "begin date" is not bigger than "end date"
    if data_fetch_req.begin_date and data_fetch_req.end_date:
        if is_date_greater(data_fetch_req.begin_date, data_fetch_req.end_date):
            errors['begin_date'] = 'Data de início não é válida'
            errors['end_date'] = 'Data de fim não é válida'

    # verify vagas
    if data_fetch_req.vagas:
        vagas_strs = [vaga for vaga in data_fetch_req.vagas.split(',') if vaga]
        if all([is_positive_number(vaga) for vaga in vagas_strs]):
            data_fetch_dal.vagas = [int(vaga) for vaga in vagas_strs]
        else:
            errors['vagas'] = 'Vagas têm de ser número inteiro positivo'

    # verify Covid
    if data_fetch_req.covid:
        if is_number(data_fetch_req.covid):
            covid = int(data_fetch_req.covid)
            if 0 <= covid <= 2:
                data_fetch_dal.covid = covid
            else:
                errors['covid'] = 'Valor inválido'
        else:
            errors['covid'] = 'Valor inválido'

    return data_fetch_dal, errors


# Creates patient IDs objs with the given IDs.
# params:
#   -> patient_ids: list of strings
# returns: tuple of lists. First one contains the intervals and the second the single ones.
def create_patient_ids_objs(patient_ids=None):
    if not patient_ids:
        patient_ids = []

    patient_ids_interval = []
    patient_ids_single = []

    for patient_id in patient_ids:
        # in case the current patient_id has an interval format
        if is_interval(patient_id):
            val = patient_id.split('-')
            low = int(val[0])
            high = int(val[1])
            patient_ids_interval.append({
                'low': low,
                'high': high
            })
        # case it's a single ID
        else:
            patient_ids_single.append(int(patient_id))

    return patient_ids_interval, patient_ids_single


# Helper function to give names to daily params
def give_daily_param_names(df_params, daily_params_cols: list, logger):
    df_params = df_params.set_index('ID_MERGED')
    new_params = {}
    for col in daily_params_cols:
        col_parts = col.split('_')
        col_id = int(col_parts[-1])
        try:
            param = df_params.loc[col_id]
            units = param["UNIDADES"]
            new_params[col] = f'{param["NM_ANALISE"]} | {param["NM_PARAMETRO"]} ({"_".join(col_parts[:-1])}) {units if units else ""}'
        except KeyError:
            logger.warning(f'Parameter "{col_id}" does not exist in {global_vars.V_PARAMS_MERGED} - '
                           f'will skip this parameter in init data.')

    return new_params


def get_param_info(param: str, res_daily: bool, get_merged_params):
    # name of the parameter
    # if the parameter field is a biomarker, then fetch the name from DB.
    # else, just use the same name
    # has to check if it's res daily or not, so know how to construct the name
    if res_daily:
        param_parts = param.split('_')
        df_param = get_merged_params([param_parts[-1]])
        if len(df_param.index) == 0:
            raise BadRequestException(content={'params': 'Valores de parâmetro inválidos'})

        param = df_param.iloc[0]
        analysis_name = param["NM_ANALISE"]
        param_name = f'{param["NM_PARAMETRO"]} ({" ".join(param_parts[:-1])})'
        units = param["UNIDADES"]
    else:
        if str(param).isnumeric():
            df_param = get_merged_params([param])
            if len(df_param.index) == 0:
                raise BadRequestException(content={'params': 'Valores de parâmetro inválidos'})

            param = df_param.iloc[0]
            analysis_name = param["NM_ANALISE"]
            param_name = param["NM_PARAMETRO"]
            units = param["UNIDADES"]
        else:
            param_name = param.title()
            analysis_name = ''
            units = ''

    return analysis_name, param_name, units
