from src.dal.dalInterfaces.GenericDALInt import GenericDALInt
from src.dal.dalInterfaces.ParamsDALInt import ParamsDALInt
from src.dal.dalInterfaces.PatientDataDALInt import PatientDataDALInt
from src.dto.DataModels import DataFetchDAL
from src.dto.InitDataModels import InitFormData, InitDataResp, InitData
from src.services.servicesInterfaces.InitDataServInt import InitDataServInt
from src.utils import data
from src.utils.logger import get_app_logger


class InitDataServices(InitDataServInt):

    def __init__(self, params_dal: ParamsDALInt, generic_dal: GenericDALInt, patient_data_dal: PatientDataDALInt):
        self.__params_dal = params_dal
        self.__generic_dal = generic_dal
        self.__patient_data_dal = patient_data_dal
        self.__logger = get_app_logger()

    def get_init_data(self) -> InitDataResp:
        init_data_resp = InitDataResp()
        init_data_resp.init_form_data = self.__get_init_form_data()
        init_data_resp.init_data = self.__get_init_data()

        return init_data_resp

    def __get_init_form_data(self):
        init_form_data = InitFormData()

        params = self.__params_dal.get_merged_params()
        for idx, param in params.iterrows():
            units = param["UNIDADES"]
            init_form_data.params.append({
                'value': param['ID_MERGED'],
                'display_name': f'{param["NM_ANALISE"]} | {param["NM_PARAMETRO"]} {units if units else ""}'
            })

        init_form_data.params.append({
            'value': 'IDADE',
            'display_name': 'Idade'
        })

        daily_params = self.__params_dal.get_daily_params()
        daily_params_names = data.give_daily_param_names(params, daily_params, self.__logger)

        for daily_param in daily_params_names:
            init_form_data.daily_params.append({
                'value': daily_param,
                'display_name': daily_params_names[daily_param]
            })

        vagas = self.__generic_dal.get_vagas()
        for idx, vaga in vagas.iterrows():
            v = int(vaga['VAGA'])
            init_form_data.waves.append(v)

        demography = self.__generic_dal.get_demography()
        init_form_data.demography = [
            {
                'display_name': str(col).replace('_', ' ').title(),
                'value': col
            }
            for col in list(demography.columns.values)
        ]

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
