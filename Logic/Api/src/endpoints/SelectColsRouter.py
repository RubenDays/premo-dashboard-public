from fastapi import APIRouter, Depends

from src.dto.DataModels import ChangeColsReq
from src.dto.UserModels import User
from src.services.SecurityServices import get_current_active_user, get_current_active_admin_user
from src.services.servicesInterfaces.SelectColServInt import SelectColsServInt


class SelectColsRouter(APIRouter):

    def __init__(self, select_cols_services: SelectColsServInt):
        self.__select_cols_services = select_cols_services

        super().__init__(prefix='/select-cols', tags=['select-cols'])

        super().add_api_route(path='', endpoint=self.change_cols, methods=['POST'])

    # @router.post('')
    def change_cols(self, admin_user: User = Depends(get_current_active_admin_user), body: ChangeColsReq = Depends()):
        resp = self.__select_cols_services.change_cols(body)

        return {'yes': 'no'}
