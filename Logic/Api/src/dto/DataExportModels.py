from pydantic import BaseModel
from typing import Union


# client to API
class DataExportReq(BaseModel):
    patient_ids: Union[str, None]
    begin_date: Union[str, None]
    end_date: Union[str, None]


# Services to DAL
class DataExportDAL:
    patient_ids: Union[int, None] = None
    begin_date: Union[str, None] = None
    end_date: Union[str, None] = None
