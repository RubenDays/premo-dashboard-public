import numpy as np
import pandas as pd

from src.dal.dalInterfaces.GenericDALInt import GenericDALInt
from src.dal.dalInterfaces.ParamsDALInt import ParamsDALInt
from src.dal.dalInterfaces.PatientDataDALInt import PatientDataDALInt
from src.dto.DataModels import DataFetchReq, DataFetchDAL
from src.exceptions.CustomExceptions import BadRequestException
from src.services.servicesInterfaces.StatsGraphsServInt import StatsGraphsServInt
from src.utils import data
from src.utils.data import get_params_info, get_params_info_with_ratios
from src.utils.logger import get_app_logger
from src.utils.verifications import is_patient_ids_input_valid, is_valid_date, is_date_greater, \
    is_positive_number, is_number, is_valid_day_uci, verify_ratio_params, is_icu_days_input_valid


class StatsGraphsServices(StatsGraphsServInt):

    def __init__(self, patient_data_dal: PatientDataDALInt, params_dal: ParamsDALInt, generic_dal: GenericDALInt):
        self.__patient_data_dal = patient_data_dal
        self.__params_dal = params_dal
        self.__logger = get_app_logger()

        self.__demography_cols = generic_dal.get_demography().columns.tolist()
        self.__param_cols = generic_dal.get_params()
        self.__daily_param_cols = generic_dal.get_daily_params()
        self.__enum_columns = patient_data_dal.get_enum_columns()

    def get_boxplot_data(self, username: str, data_fetch_req: DataFetchReq):
        self.__logger.info('Verifying line selectors...', username)
        data_fetch_dal, errors = self.__verify_line_selectors(data_fetch_req)

        # verify demography, only if it exists
        demography = data_fetch_req.demography
        if demography and not self.__verify_demography(demography):
            errors['demography'] = 'Valores de demografia inválidos'

        # verify params
        param = data_fetch_req.params
        ratio_param = data_fetch_req.ratio_params
        if (not param and not ratio_param) or (param and ratio_param):
            errors['params'] = 'Valores de parâmetro inválidos'
            errors['ratio_params'] = 'Valores de parâmetro inválidos'

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        # verify params
        if param is not None:
            if param not in (self.__daily_param_cols if data_fetch_dal.res_daily else self.__param_cols):
                errors['params'] = 'Valores de parâmetro inválidos'
            else:
                data_fetch_dal.params = [param]

        # verify ratio params
        rp_check, rps = verify_ratio_params(data_fetch_req.ratio_params,
                                           self.__daily_param_cols if data_fetch_dal.res_daily else self.__param_cols)
        if not rp_check:
            errors['ratio_params'] = 'Valores de parâmetro inválidos'

        # verify amount of params
        if len(data_fetch_dal.params) + len(rps) != 1:
            errors['ratio_params'] = 'Valores de parâmetro inválidos'
            errors['params'] = 'Valores de parâmetro inválidos'

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        if demography:
            data_fetch_dal.demography = [demography]

        if demography != 'VAGA':
            data_fetch_dal.demography.extend(['VAGA'])

        params = []
        params.extend(data_fetch_dal.params)
        data_fetch_dal.params.extend(list(set(np.array(rps).flatten())))

        # fetch data
        df_data = self.__patient_data_dal.fetch_patient_data(data_fetch_dal)

        named_params = get_params_info_with_ratios(params, data_fetch_dal.res_daily, rps, self.__params_dal.get_merged_params)

        for rp in rps:
            dividend = rp[0]
            divisor = rp[1]
            dividend_values = pd.to_numeric(df_data[dividend])
            param = f'{dividend}_{divisor}'
            divisor_values = pd.to_numeric(df_data[divisor])
            df_data[param] = np.where(divisor_values != 0, dividend_values / divisor_values, np.nan)\
                .round(decimals=3)

        df_data = df_data.dropna()

        datasets = []
        display_labels = ['']

        ds = df_data['VAGA'].unique().tolist()
        ds.sort()
        vagas_ds = []
        for vaga in ds:
            vagas_ds.append(tuple((vaga, df_data[df_data['VAGA'] == vaga])))

        # gets the different values of demography, if one has been selected, and separates the values by demography
        # otherwise, use all values as one demography value
        if demography:
            labels, display_labels = self.__get_labels(df_data, demography)
            for vaga_title, vaga_df in vagas_ds:
                values = []
                for label in labels:
                    vals = vaga_df[param][vaga_df[demography] == label].dropna().values.tolist()
                    values.append(vals)
                datasets.append({
                    'subtitle': vaga_title,
                    'values': values
                })
        else:
            for vaga_title, vaga_df in vagas_ds:
                vals = vaga_df[param].dropna().values.tolist()
                datasets.append({
                    'subtitle': vaga_title,
                    'values': [vals]
                })

        return {
            'labels': {
                'paramName': named_params[param]['param_name'],
                'analysis_name': named_params[param]['analysis_name'],
                'units': named_params[param]['units'],
                'xText': demography.replace('_', ' ').title() if demography else '',
                'xTicks': display_labels
            },
            'data': datasets,
        }

    def get_scatter_data(self, data_fetch_req: DataFetchReq):
        data_fetch_dal, errors = self.__verify_line_selectors(data_fetch_req)

        # verify params
        if not data_fetch_req.params:
            errors['params'] = 'Valores de parâmetro inválidos'
        else:
            params_parts = data_fetch_req.params.split(',')
            if len(params_parts) > 0:
                # if all params exist or if all daily params exist
                if (not data_fetch_dal.res_daily and all([param in self.__param_cols for param in params_parts])) \
                        or (
                        data_fetch_dal.res_daily and all([param in self.__daily_param_cols for param in params_parts])):
                    data_fetch_dal.params = params_parts
                else:
                    errors['params'] = 'Valores de parâmetro inválidos'
            else:
                errors['params'] = 'Valores de parâmetro inválidos'

        # verify ratio params
        rp_check, rps = verify_ratio_params(data_fetch_req.ratio_params,
                                           self.__daily_param_cols if data_fetch_dal.res_daily else self.__param_cols)
        if not rp_check:
            errors['ratio_params'] = 'Valores de parâmetro inválidos'

        if len(data_fetch_dal.params) + len(rps) != 2:
            errors['ratio_params'] = 'Valores de parâmetro inválidos'
            errors['params'] = 'Valores de parâmetro inválidos'

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        data_fetch_dal.demography = ['VAGA']

        params = []
        params.extend(data_fetch_dal.params)
        data_fetch_dal.params.extend(list(set(np.array(rps).flatten())))

        df_data = self.__patient_data_dal.fetch_patient_data(data_fetch_dal)

        # params = get_params_info(data_fetch_dal.params, data_fetch_dal.res_daily, self.__params_dal.get_merged_params)
        params = get_params_info_with_ratios(params, data_fetch_dal.res_daily, rps, self.__params_dal.get_merged_params)

        for rp in rps:
            dividend = rp[0]
            divisor = rp[1]
            dividend_values = pd.to_numeric(df_data[dividend])
            divisor_values = pd.to_numeric(df_data[divisor])
            df_data[f'{dividend}_{divisor}'] = np.where(divisor_values != 0, dividend_values / divisor_values, np.nan)\
                .round(decimals=3)

        df_data = df_data.dropna()

        vagas_labels = df_data['VAGA'].unique().tolist()
        vagas_labels.sort()
        waves_graphs = []
        for vaga in vagas_labels:
            df_vaga = df_data[df_data['VAGA'] == vaga]
            graph = {
                "subtitle": vaga,
                "x": [],
                "y": []
            }
            for idx, col in enumerate(params):
                if idx == 0:
                    graph["x"] = df_vaga[str(col)].values.tolist()
                else:
                    graph["y"] = df_vaga[str(col)].values.tolist()
            waves_graphs.append(graph)

        keys = list(params.keys())
        labels = {
            'xAxis': params[keys[0]],
            'yAxis': params[keys[1]]
        }

        return {
            'labels': labels,
            'waves_graphs': waves_graphs
        }

    def get_nominal_data(self, data_fetch_req: DataFetchReq):
        data_fetch_dal, errors = self.__verify_line_selectors(data_fetch_req)

        # verify demography
        demography = data_fetch_req.demography
        if not self.__verify_demography(demography):
            errors['demography'] = 'Valores de demografia inválidos'
        elif demography != 'VAGA':
            data_fetch_dal.demography = ['VAGA']

        data_fetch_dal.demography.append(demography)
        if len(errors) > 0:
            raise BadRequestException(content=errors)

        df_data = self.__patient_data_dal.fetch_patient_data_nominal(data_fetch_dal)

        labels, display_labels = self.__get_labels(df_data, demography)

        ds = df_data['VAGA'].unique().tolist()
        ds.sort()
        data = []
        for vaga in ds:
            vaga_ds = df_data[df_data['VAGA'] == vaga]
            vaga_title = vaga

            values = []
            for label in labels:
                values.append(len(vaga_ds[vaga_ds[demography] == label].index))

            data.append({
                'subtitle': vaga_title,
                'values': values
            })

        return {
            'demography': demography.replace('_', ' ').title(),
            'labels': display_labels,
            'data': data
        }

    def __verify_line_selectors(self, data_fetch_req: DataFetchReq):
        errors = {}
        data_fetch_dal = DataFetchDAL()

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
                patient_ids_interval, patient_ids_single = data.create_patient_ids_objs(patient_ids)
                data_fetch_dal.patient_ids_interval = patient_ids_interval
                data_fetch_dal.patient_ids_single = patient_ids_single

        # verify begin date
        if data_fetch_req.begin_date:
            if not is_valid_date(data_fetch_req.begin_date):
                errors['begin_date'] = 'Data de início não é válida'
            else:
                data_fetch_dal.begin_date = data_fetch_req.begin_date

        # verify day uci
        if data_fetch_req.day_uci:

            # remove whitespaces and separate with ';', also removing resulting empty strings
            icu_days = [input_id for input_id in data_fetch_req.day_uci.strip(' ').split(';') if input_id]

            # verify format of IDs
            if not is_icu_days_input_valid(icu_days):
                errors['day_uci'] = 'IDs não possuem o formato correto'
            # if IDs are in the correct format, build data_export_dal
            else:
                icu_days_interval, icu_days_single = data.create_icu_days_objs(icu_days)
                data_fetch_dal.icu_days_interval = icu_days_interval
                data_fetch_dal.icu_days_single = icu_days_single

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

        # verify UCI
        if data_fetch_req.uci:
            if is_number(data_fetch_req.uci):
                uci = int(data_fetch_req.uci)
                if 0 <= uci <= 2:
                    data_fetch_dal.uci = uci
                else:
                    errors['uci'] = 'Valor inválido'
            else:
                errors['uci'] = 'Valor inválido'

        if data_fetch_req.res_daily:
            if data_fetch_req.res_daily == 'false':
                data_fetch_dal.res_daily = False
            elif data_fetch_req.res_daily == 'true':
                data_fetch_dal.res_daily = True
            else:
                errors['res_daily'] = 'Valor inválido'

        return data_fetch_dal, errors

    def __get_labels(self, df_data, demography):
        labels = df_data[demography].unique().tolist()
        if demography in self.__enum_columns:
            labels, display_labels = self.__patient_data_dal.get_enum_values(self.__enum_columns[demography])
        elif demography == 'SEXO':
            display_labels = ['Masculino' if val == 0 else 'Feminino' for val in labels]
        elif demography == 'VAGA':
            display_labels = [f'Vaga {val}' for val in labels]
        else:
            display_labels = ['Não' if val == 0 else 'Sim' for val in labels]

        return labels, tuple(display_labels)

    def __verify_demography(self, demography):
        return demography and demography in self.__demography_cols

    def __verify_params(self, params):
        return params and params.split(',') in self.__param_cols
