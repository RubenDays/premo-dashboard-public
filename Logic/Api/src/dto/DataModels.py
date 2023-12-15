from pydantic import BaseModel
from typing import Union


# ______________________________________________________________________________________________________________________
#  -> Classes to API must extend from BaseModel so that FastAPI can parse.
# ----------------------------------------------------------------------
#  -> Classes for DAL must have the __init__ for setting the default values, otherwise Python will try to reuse same
# values from previous calls and will result in inconsistencies.
# ______________________________________________________________________________________________________________________

class ChangeColsReq(BaseModel):
    demography: list
    params: list
    non_selected: list


class ChangeColsDal:
    demography: list
    params: list
    non_selected: list

    def __init__(self):
        self.demography = []
        self.params = []
        self.non_selected = []


# client to API
class UpdateUserBody(BaseModel):
    username: Union[str, None]
    enabled: Union[str, None]
    role: Union[str, None]
    reset_pwd: Union[str, None]


class UpdateUserDAL:
    username: Union[str, None]
    enabled: bool
    role: Union[str, None]
    pwd: Union[str, None]

    def __init__(self):
        self.username = None
        self.enabled = False
        self.role = None
        self.pwd = None


# client to API
class FetchUsersParams(BaseModel):
    username: Union[str, None]
    page: Union[str, None]
    max_per_page: Union[str, None]


class FetchUsersDAL:
    username: Union[str, None]
    page: int
    max_per_page: int

    def __init__(self):
        self.username = None
        self.page = 1
        self.max_per_page = 10


# client to API
class DataExportReq(BaseModel):
    patient_ids: Union[str, None]
    begin_date: Union[str, None]
    end_date: Union[str, None]
    demography: Union[str, None]
    params: Union[str, None]
    res_daily: Union[str, None]
    therapy: Union[str, None]
    day_uci: Union[str, None]


# Services to DAL
class DataExportDAL:
    patient_ids_interval: list
    patient_ids_single: list
    begin_date: Union[str, None]
    end_date: Union[str, None]
    demography: list
    params: list
    res_daily: bool
    icu_days_single: list
    icu_days_interval: list

    def __init__(self):
        self.patient_ids_interval = []
        self.patient_ids_single = []
        self.begin_date = None
        self.end_date = None
        self.demography = []
        self.params = []
        self.res_daily = False
        self.icu_days_single = []
        self.icu_days_interval = []


# client -> API
class DataFetchReq(BaseModel):
    patient_ids: Union[str, None]
    begin_date: Union[str, None]
    end_date: Union[str, None]
    vagas: Union[str, None]
    covid: Union[str, None]
    uci: Union[str, None]
    demography: Union[str, None]    # nominal variables
    params: Union[str, None]    # quantitative variables
    res_daily: Union[str, None]
    day_uci: Union[str, None]
    ratio_params: Union[str, None] # quantitative variables for ratio


# Services -> DAL
class DataFetchDAL:
    patient_ids_interval: list
    patient_ids_single: list
    begin_date: Union[str, None]
    end_date: Union[str, None]
    vagas: list
    covid: int
    uci: int
    demography: list
    params: list
    res_daily: bool
    icu_days_single: list
    icu_days_interval: list
    ratio_params: list

    def __init__(self):
        self.patient_ids_interval = []
        self.patient_ids_single = []
        self.begin_date = None
        self.end_date = None
        self.vagas = []
        self.covid = 2
        self.uci = 2
        self.demography = []
        self.params = []
        self.res_daily = False
        self.icu_days_single = []
        self.icu_days_interval = []
        self.ratio_params = []


# client -> API
class DataKMFetchReq(BaseModel):
    patient_ids: Union[str, None]
    begin_date: Union[str, None]
    end_date: Union[str, None]
    vagas: Union[str, None]
    covid: Union[str, None]
    demography: Union[str, None]    # nominal variables
    params: Union[str, None]    # quantitative variables
    cutoffs: Union[str, None]    # cutoff for KM


# Services -> DAL
class DataKMFetchDAL:
    patient_ids_interval: list
    patient_ids_single: list
    begin_date: Union[str, None]
    end_date: Union[str, None]
    vagas: list
    covid: int
    demography: list
    params: list
    cols: list
    cutoffs: list

    def __init__(self):
        self.patient_ids_interval = []
        self.patient_ids_single = []
        self.begin_date = None
        self.end_date = None
        self.vagas = []
        self.covid = 2
        self.demography = []
        self.params = []
        self.cols = []
        self.cutoffs = []


# client -> API
class DataLongFetchReq(BaseModel):
    patient_ids: Union[str, None]
    begin_date: Union[str, None]
    end_date: Union[str, None]
    res_daily: Union[str, None]
    params: Union[str, None]  # quantitative variables
    ratio_params: Union[str, None]  # quantitative ratio variables


# Services -> DAL
class DataLongFetchDAL:
    patient_ids_interval: list
    patient_ids_single: list
    begin_date: Union[str, None]
    end_date: Union[str, None]
    res_daily: bool
    params: list

    def __init__(self):
        self.patient_ids_interval = []
        self.patient_ids_single = []
        self.begin_date = None
        self.end_date = None
        self.res_daily: False
        self.params = []


class DataFetchTherapy:
    patient_ids_interval: list
    patient_ids_single: list
    begin_date: Union[str, None]
    end_date: Union[str, None]
    therapy: list
    longitudinal: bool

    def __init__(self):
        self.patient_ids_interval = []
        self.patient_ids_single = []
        self.begin_date = None
        self.end_date = None
        therapy = []
        longitudinal = False
