import pandas as pd

from src.dal.dalInterfaces.ColsDALInt import ColsDALInt
from src.dto.DataModels import ChangeColsReq, ChangeColsDal
from src.exceptions.CustomExceptions import BadRequestException
from src.services.servicesInterfaces.SelectColServInt import SelectColsServInt
from src.utils.logger import get_app_logger


class SelectColsServices(SelectColsServInt):

    def __init__(self, cols_dal: ColsDALInt):
        self.__logger = get_app_logger()
        self.__cols_dal = cols_dal

    def change_cols(self, cols_req: ChangeColsReq):
        db_cols = self.__cols_dal.get_cols()['COL_NAME'].values.tolist()

        errors = {}
        if not self.__are_all_present(cols_req.demography, db_cols) \
                or not self.__are_all_present(cols_req.params, db_cols) \
                or not self.__are_all_present(cols_req.non_selected, db_cols):
            errors['cols'] = 'Invalid cols'

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        change_cols_dal = ChangeColsDal()
        change_cols_dal.params = cols_req.params
        change_cols_dal.demography = cols_req.demography
        change_cols_dal.non_selected = cols_req.non_selected

        self.__cols_dal.change_cols(change_cols_dal)

    # check if elements
    def __are_all_present(self, to_check: list, complete: list):
        return all(v in complete for v in to_check)
