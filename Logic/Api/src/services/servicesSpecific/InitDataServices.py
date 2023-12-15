from src.dal.dalInterfaces.ColsDALInt import ColsDALInt
from src.dal.dalInterfaces.GenericDALInt import GenericDALInt
from src.dal.dalInterfaces.ParamsDALInt import ParamsDALInt
from src.dal.dalInterfaces.PatientDataDALInt import PatientDataDALInt
from src.dto.DataModels import DataFetchDAL
from src.dto.InitDataModels import InitFormData, InitDataResp, InitData
from src.services.servicesInterfaces.InitDataServInt import InitDataServInt
from src.utils import data
from src.utils.logger import get_app_logger


class InitDataServices(InitDataServInt):

    def __init__(self, params_dal: ParamsDALInt,
                 generic_dal: GenericDALInt,
                 patient_data_dal: PatientDataDALInt,
                 cols_dal: ColsDALInt):
        self.__params_dal = params_dal
        self.__generic_dal = generic_dal
        self.__patient_data_dal = patient_data_dal
        self.__cols_dal = cols_dal
        self.__logger = get_app_logger()

    def get_init_data(self) -> InitDataResp:
        init_data_resp = InitDataResp()
        init_data_resp.init_form_data = self.__get_init_form_data()
        init_data_resp.init_data = self.__get_init_data()

        return init_data_resp

    def __get_init_form_data(self):
        init_form_data = InitFormData()

        df_cols = self.__cols_dal.get_cols()

        # Params
        params = self.__params_dal.get_merged_params()
        for idx, param in params.iterrows():
            units = param["UNIDADES"]
            init_form_data.params.append({
                'value': param['ID_MERGED'],
                'display_name': f'{param["NM_ANALISE"]} | {param["NM_PARAMETRO"]} {units if units else ""}'
            })

        # daily params
        daily_params = self.__params_dal.get_daily_params()
        daily_params_names = data.give_daily_param_names(params, daily_params, self.__logger)

        for daily_param in daily_params_names:
            init_form_data.daily_params.append({
                'value': daily_param,
                'display_name': daily_params_names[daily_param]
            })

        # adds the columns selected as "p" for params and daily params
        for p in df_cols[df_cols['TYPE'] == 'p']['COL_NAME'].values.tolist():
            init_form_data.params.append({
                'value': p,
                'display_name': str(p).replace('_', ' ').title()
            })
            init_form_data.daily_params.append({
                'value': p,
                'display_name': str(p).replace('_', ' ').title()
            })

        # add waves
        vagas = self.__generic_dal.get_vagas()
        for idx, vaga in vagas.iterrows():
            v = int(vaga['VAGA'])
            init_form_data.waves.append(v)

        # add demography
        for d in df_cols[df_cols['TYPE'] == 'd']['COL_NAME'].values.tolist():
            init_form_data.demography.append({
                'value': d,
                'display_name': str(d).replace('_', ' ').title()
            })

        therapy = self.__generic_dal.get_therapy()
        init_form_data.therapy = therapy['DCI'].tolist()

        return init_form_data

    def __get_init_data(self):
        data_fetch_dal = DataFetchDAL()
        data_fetch_dal.demography = ['ID_PACIENTE', 'DATA_COLHEITA', 'VAGA']

        data_df = self.__patient_data_dal.fetch_patient_data(data_fetch_dal)

        init_data = InitData()

        waves = data_df['VAGA'].unique().tolist()
        init_data.num_waves = len(waves)
        init_data.num_patients = len(data_df['ID_PACIENTE'].unique().tolist())
        init_data.num_triages = len(data_df.index)

        for wave in waves:
            wave_name = f'Vaga {wave}'
            init_data.num_triages_waves.append({
                'wave': wave_name,
                'num_triages': len(data_df[data_df['VAGA'] == wave].index)
            })

            init_data.num_patients_waves.append({
                'wave': wave_name,
                'num_patients': len(data_df[data_df['VAGA'] == wave]['ID_PACIENTE'].unique().tolist())
            })

        return init_data
