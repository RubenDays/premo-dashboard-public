from fastapi import APIRouter, UploadFile, Depends

from src.dto.UserModels import User
from src.services.SecurityServices import get_current_active_admin_user
from src.services.servicesInterfaces.ImportServicesInt import ImportServicesInt


class ImportRouter(APIRouter):

    def __init__(self, import_services: ImportServicesInt):
        self.__import_services = import_services

        super().__init__(prefix='/import', tags=['import'])
        super().add_api_route(path='', endpoint=self.import_data, methods=['POST'])

    def import_data(self, zip_file: UploadFile, admin_user: User = Depends(get_current_active_admin_user)):
        id = self.__import_services.import_data(zip_file)

        return {
            'message': id
        }
