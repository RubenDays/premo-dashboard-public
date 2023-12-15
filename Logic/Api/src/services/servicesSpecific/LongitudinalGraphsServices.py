import pandas as pd
from lifelines import KaplanMeierFitter
import numpy as np
from lifelines.statistics import multivariate_logrank_test

from src.dal.dalInterfaces.GenericDALInt import GenericDALInt
from src.dal.dalInterfaces.ParamsDALInt import ParamsDALInt
from src.dal.dalInterfaces.PatientDataDALInt import PatientDataDALInt
from src.dto.DataModels import DataKMFetchReq, DataLongFetchReq
from src.exceptions.CustomExceptions import BadRequestException
from src.services.servicesInterfaces.LongitudinalGraphsServInt import LongitudinalGraphsServInt
from src.utils.data import verify_long_line_selectors, verify_km_line_selectors, get_param_info, \
    get_params_info_with_ratios
from src.utils.logger import get_app_logger
from src.utils.verifications import is_float, verify_ratio_params


class LongitudinalGraphsServices(LongitudinalGraphsServInt):

    def __init__(self, patient_data_dal: PatientDataDALInt, params_dal: ParamsDALInt, generic_dal: GenericDALInt):
        self.__patient_data_dal = patient_data_dal
        self.__params_dal = params_dal
        self.__logger = get_app_logger()

        self.__demography_cols = generic_dal.get_demography().columns.tolist()
        self.__param_cols = generic_dal.get_params()
        self.__daily_param_cols = generic_dal.get_daily_params()
        self.__enum_columns = patient_data_dal.get_enum_columns()

    def __param_evolution_verify_and_fetch(self, data_fetch_req):
        data_fetch_dal, errors = verify_long_line_selectors(data_fetch_req)

        param = data_fetch_req.params
        if param:
            if (data_fetch_dal.res_daily and param not in self.__daily_param_cols) or \
                    (not data_fetch_dal.res_daily and param not in self.__param_cols):
                errors['params'] = 'Valores de parâmetro inválidos'
            else:
                data_fetch_dal.params = [param]

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        # verify ratio params
        rp_check, rps = verify_ratio_params(data_fetch_req.ratio_params,
                                            self.__daily_param_cols if data_fetch_dal.res_daily else self.__param_cols)
        if not rp_check:
            errors['ratio_params'] = 'Valores de parâmetro inválidos'

        # verify amount of params
        if len(data_fetch_dal.params) + len(rps) != 1:
            errors['ratio_params'] = 'Valores de parâmetro inválidos'
            errors['params'] = 'Valores de parâmetro inválidos'

        params = []
        params.extend(data_fetch_dal.params)
        data_fetch_dal.params.extend(list(set(np.array(rps).flatten())))

        df_all = self.__patient_data_dal.fetch_long_data(data_fetch_dal)

        named_params = get_params_info_with_ratios(data_fetch_dal.params, data_fetch_dal.res_daily, rps,
                                                   self.__params_dal.get_merged_params)

        for rp in rps:
            dividend = rp[0]
            divisor = rp[1]
            dividend_values = pd.to_numeric(df_all[dividend])
            param = f'{dividend}_{divisor}'
            divisor_values = pd.to_numeric(df_all[divisor])
            df_all[param] = np.where(divisor_values != 0, dividend_values / divisor_values, np.nan) \
                .round(decimals=3)

        df_all = df_all.dropna()

        return param, named_params, df_all, data_fetch_dal

    def get_longitudinal_separated_data(self, data_fetch_req: DataLongFetchReq):
        param, named_params, df_all, data_fetch_dal = self.__param_evolution_verify_and_fetch(data_fetch_req)

        # calculates the median for each patient in each uci day and converts the result into float
        df_median = df_all.groupby(['ID_PACIENTE', 'DIA_UCI'])[[param]].median().reset_index().astype({param: float})

        # gets every patient
        patients = df_all['ID_PACIENTE'].unique().tolist()
        lines_data = []
        for patient in patients:
            d = df_median[df_median['ID_PACIENTE'] == patient]
            vaga = df_all[df_all['ID_PACIENTE'] == patient]['VAGA'].iloc[0] # first value
            lines_data.append({
                'line_title': f'Paciente {patient} (vaga {vaga})',
                'x': d['DIA_UCI'].values.tolist(),
                'y': d[param].round(decimals=3).values.tolist()
            })

        return {
            'graphs_data': [{
                'lines_data': lines_data
            }],
            'param': named_params[param]
        }

    def get_longitudinal_aggr_data(self, data_fetch_req: DataLongFetchReq):
        param, named_params, df_all, data_fetch_dal = self.__param_evolution_verify_and_fetch(data_fetch_req)

        vagas_labels = df_all['VAGA'].unique().tolist()
        vagas_labels.sort()

        # separate by waves
        waves_graphs = []
        for vaga in vagas_labels:
            # retrieves the values for this wave
            df_vaga = df_all[df_all['VAGA'] == vaga]

            # calculates the median for each uci day and converts the result into float
            df_day_uci = df_vaga
            # if not res_daily then the patient will have more than 1 value for each day and needs to only have 1.
            # so in this case, the median of each day is calculated, so it will have only 1 value
            if not data_fetch_dal.res_daily:
                df_day_uci = df_vaga.groupby(['ID_PACIENTE', 'DIA_UCI'])[[param]].median().reset_index().astype({param: float})

            df_day_uci_median = df_day_uci.groupby(['DIA_UCI'])[[param]].median().reset_index().astype({param: float})

            waves_graphs.append({
                'subtitle': vaga,
                'x': df_day_uci_median['DIA_UCI'].values.tolist(),
                'y': df_day_uci_median[param].round(decimals=3).values.tolist()
            })

        # do for all waves
        all_graph = {"x": [], "y": []}
        df_day_uci_all = df_all
        if not data_fetch_dal.res_daily:
            df_day_uci_all = df_all.groupby(['ID_PACIENTE', 'DIA_UCI'])[[param]].median().reset_index().astype({param: float})

        df_day_uci_all_median = df_day_uci_all.groupby(['DIA_UCI'])[[param]].median().reset_index().astype({param: float})
        all_graph["x"] = df_day_uci_all_median['DIA_UCI'].values.tolist()
        all_graph["y"] = df_day_uci_all_median[param].round(decimals=3).values.tolist()

        return {
            "all_graph": all_graph,
            "waves_graphs": waves_graphs,
            'label': named_params[param]
        }

    def get_km_data(self, data_fetch_req: DataKMFetchReq):
        data_fetch_dal, errors = verify_km_line_selectors(data_fetch_req)

        # verify demography, only if it exists
        demography = data_fetch_req.demography
        if demography:
            if not self.__verify_demography(demography):
                errors['demography'] = 'Valores de demografia inválidos'
            else:
                data_fetch_dal.demography = [demography]

        param = data_fetch_req.params
        analysis_name, param_name, units = '', '', ''
        if param:
            cutoffs = self.__verify_cutoffs(data_fetch_req.cutoffs)
            if len(cutoffs) == 0:
                errors['cutoff'] = 'Valores de cutoff inválidos'
            if param not in self.__daily_param_cols:
                errors['params'] = 'Valores de parâmetro inválidos'
            else:
                data_fetch_dal.params.extend([param])
                data_fetch_dal.cutoffs = cutoffs
                analysis_name, param_name, units = \
                    get_param_info(param, True, self.__params_dal.get_merged_params)

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        # only add VAGA if it's not added yet, otherwise there will be 2 identical columns and will result in errors
        if demography != 'VAGA':
            data_fetch_dal.params.extend(['VAGA'])

        df_all = self.__patient_data_dal.fetch_km_data(data_fetch_dal)

        vagas_labels = df_all['VAGA'].unique().tolist()
        vagas_labels.sort()

        df_objs = [{
            'label': '',
            'df': df_all
        }]

        # split df with demography
        df_demos_vals = []
        for demo in data_fetch_dal.demography:
            df = df_objs[0]['df']
            labels, display_labels = self.__get_labels(df, demo)

            for idx, label in enumerate(labels):
                df_demos_vals.append({
                    'label': display_labels[idx],
                    'df': df[df[demo] == label]
                })

        # set the new df's if it was split with demography values
        if len(df_demos_vals) > 0:
            df_objs = df_demos_vals

        # split the existing df's with cutoffs
        df_cutoff_vals = []
        for cutoff in data_fetch_dal.cutoffs:
            sign = cutoff["sign"]
            value = cutoff["value"]
            for df_obj in df_objs:
                df_cutoff, sign_label = self.__get_cutoff_df(sign, value, df_obj['df'], param)
                df_cutoff_vals.append({
                    'label': f'{df_obj["label"]} {sign_label}'.strip(),
                    'df': df_cutoff
                })

        # set the new df's if it was split with cutoff values
        if len(df_cutoff_vals) > 0:
            df_objs = df_cutoff_vals

        # initialize the list that contains the data for each wave
        waves_km_data = [{'subtitle': vaga, 'data': []} for vaga in vagas_labels]

        # add a group for each one
        for idx, df_obj in enumerate(df_objs):
            df_obj['df'] = df_obj['df'].dropna(how='any')
            df_obj['df']['group'] = idx

        # calculate survival function and pValues for each wave
        for idx, vaga_label in enumerate(vagas_labels):
            dfs_vaga = []
            for df_obj in df_objs:
                label = df_obj["label"]
                df = df_obj["df"]
                df_obj_vaga = df[df['VAGA'] == vaga_label]

                wave_durations = df_obj_vaga['duration'].tolist()
                wave_events_observed = df_obj_vaga['event_observed'].tolist()

                # only calculate KM if there's any values
                if len(wave_durations) > 0:
                    km_obj = self.__create_km_data_obj(wave_durations, wave_events_observed, label.title())
                    waves_km_data[idx]['data'].append(km_obj)

                    dfs_vaga.append(df_obj_vaga)

            stats = self.__calculate_p_values(dfs_vaga)
            waves_km_data[idx]['stats'] = stats

        # calculate survival functions and pValues for all waves
        all_km_data = []
        all_dfs = []
        for idx, df_obj in enumerate(df_objs):
            label = df_obj["label"]
            df = df_obj["df"]

            wave_durations = df['duration'].tolist()
            wave_events_observed = df['event_observed'].tolist()

            # only calculate KM if there's any values
            if len(wave_durations) > 0:
                km_obj = self.__create_km_data_obj(wave_durations, wave_events_observed, label.title())
                all_km_data.append(km_obj)

                all_dfs.append(df)

        all_stats = self.__calculate_p_values(all_dfs)  

        return {
            'all_km_data': {
                'data': all_km_data,
                'stats': all_stats
            },
            'waves_km_data': waves_km_data,
            'demography': demography.replace('_', ' ').title() if demography else '',
            'param': {
                'analysisName': analysis_name,
                'paramName': param_name,
                'units': units,
            }
        }

    def __get_cutoff_df(self, sign, value, df, param):
        if sign == '<':
            return df[df[param] < value], f'< {value}'
        elif sign == '>':
            return df[df[param] > value], f'> {value}'
        elif sign == '=':
            return df[df[param] == value], f'= {value}'
        elif sign == '<=':
            return df[df[param] <= value], f'<= {value}'
        elif sign == '>=':
            return df[df[param] >= value], f'>= {value}'
        elif sign == 'AND':
            return df[df[param].between(value[0], value[1])], f'{value[0]} - {value[1]}'
        elif sign == 'OR':
            return df[(df[param] < value[0]) | (df[param] > value[1])], f'< {value[0]} V > {value[1]}'
        else:
            return df[df[param] != value], f'!= {value}'

    def __create_km_data_obj(self, durations: list, events_observed: list, title: str):
        # create a kmf object
        kmf = KaplanMeierFitter()

        # Fit the data into the model
        label = 'km_estimate'
        ci_lower_label = f'{label}_lower'
        ci_upper_label = f'{label}_upper'
        kmf.fit(durations, events_observed, label=label, ci_labels=[ci_lower_label, ci_upper_label])

        surv_func = kmf.survival_function_
        conf_interval = kmf.confidence_interval_
        timeline = surv_func.index.tolist()

        # get the y, x values
        surv_est = surv_func[label].tolist()
        ci_lower_est = conf_interval[ci_lower_label].tolist()
        ci_upper_est = conf_interval[ci_upper_label].tolist()

        return {
            'title': title,
            'survival_function': {
                'timeline': timeline,
                'km_estimate': surv_est
            },
            'confidence_interval': {
                'timeline': timeline,
                'estimate_lower': ci_lower_est,
                'estimate_upper': ci_upper_est
            }
        }

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

    def __verify_cutoffs(self, cutoff: str) -> list:
        if not cutoff:
            return []

        cutoffs = []

        co = cutoff.strip()
        for cutoff in co.split(';'):
            if len(cutoff) > 0:
                if '<=' in cutoff:
                    v = cutoff[2:]
                    if not is_float(v):
                        return []
                    cutoffs.append({'sign': '<=', 'value': float(v)})
                    cutoffs.append({'sign': '>', 'value': float(v)})
                elif '>=' in cutoff:
                    v = cutoff[2:]
                    if not is_float(v):
                        return []
                    cutoffs.append({'sign': '<', 'value': float(v)})
                    cutoffs.append({'sign': '>=', 'value': float(v)})
                elif '<' in cutoff:
                    v = cutoff[1:]
                    if not is_float(v):
                        return []
                    cutoffs.append({'sign': '<', 'value': float(v)})
                    cutoffs.append({'sign': '>=', 'value': float(v)})
                elif '>' in cutoff:
                    v = cutoff[1:]
                    if not is_float(v):
                        return []
                    cutoffs.append({'sign': '<=', 'value': float(v)})
                    cutoffs.append({'sign': '>', 'value': float(v)})
                elif '=' in cutoff:
                    v = cutoff[1:]
                    if not is_float(v):
                        return []
                    cutoffs.append({'sign': '=', 'value': float(v)})
                    cutoffs.append({'sign': '!=', 'value': float(v)})
                elif '-' in cutoff:
                    c = cutoff.split('-')
                    if len(c) != 2:
                        return []
                    if not is_float(c[0]) and not is_float(c[1]):
                        return []
                    cutoffs.append({'sign': 'AND', 'value': [float(c[0]), float(c[1])]})
                    cutoffs.append({'sign': 'OR', 'value': [float(c[0]), float(c[1])]})
                else:
                    return []
        return cutoffs

    def __calculate_p_values(self, dfs_vaga):
        if not dfs_vaga or len(dfs_vaga) < 2:
            return {
                'logrank_pvalue': None,
                'breslow_pvalue': None,
                'tarone_ware_pvalue': None,
            }

        df_vaga = pd.concat(dfs_vaga)
        logrank_stats = multivariate_logrank_test(df_vaga['duration'], df_vaga['group'], df_vaga['event_observed'])
        breslow_stats = multivariate_logrank_test(df_vaga['duration'], df_vaga['group'], df_vaga['event_observed'],
                                                  weightings='wilcoxon')
        tarone_ware_stats = multivariate_logrank_test(df_vaga['duration'], df_vaga['group'], df_vaga['event_observed'],
                                                      weightings='tarone-ware')
        return {
            'logrank_pvalue': logrank_stats.p_value,
            'breslow_pvalue': breslow_stats.p_value,
            'tarone_ware_pvalue': tarone_ware_stats.p_value,
        }
