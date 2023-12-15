from pydantic import BaseModel


# API to client
class InitFormData(BaseModel):
    params: list = []
    daily_params: list = []
    waves: list = []
    demography: list = []
    therapy: list = []


class InitData(BaseModel):
    num_triages: int = 0
    num_patients: int = 0
    num_waves: int = 0
    num_patients_waves: list = []
    num_triages_waves: list = []


class InitDataResp:
    init_form_data: InitFormData
    init_data: InitData

    def __init__(self):
        self.init_data = InitData()
        self.init_form_data = InitFormData()

