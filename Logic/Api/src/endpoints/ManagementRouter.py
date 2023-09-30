from fastapi import APIRouter, Depends

from src.dto.DataModels import FetchUsersParams, UpdateUserBody
from src.dto.UserModels import User
from src.services.SecurityServices import get_current_active_admin_user
from src.services.servicesInterfaces.ManagementServicesInt import ManagementServicesInt

import time


class ManagementRouter(APIRouter):

    def __init__(self, management_services: ManagementServicesInt):
        self.__management_services = management_services

        super().__init__(prefix='/management', tags=['management'])
        super().add_api_route(path='/user', endpoint=self.create_user, methods=['POST'])
        super().add_api_route(path='/user', endpoint=self.search_users, methods=['GET'])
        super().add_api_route(path='/user/{username}', endpoint=self.update_user, methods=['PUT'])
        super().add_api_route(path='/user/{username}', endpoint=self.delete_user, methods=['DELETE'])

    # POST /management/user
    def create_user(self, new_user: User, admin_user: User = Depends(get_current_active_admin_user)):
        self.__management_services.create_user(new_user)

        return {
            'message': 'ok'
        }

    def search_users(self, query_params: FetchUsersParams = Depends(), admin_user: User = Depends(get_current_active_admin_user)):
        users = self.__management_services.search_users(query_params)

        return users

    def update_user(self, username: str, body: UpdateUserBody, admin_user: User = Depends(get_current_active_admin_user)):
        self.__management_services.update_user(admin_user, username, body)

        return {
            'message': 'ok'
        }

    def delete_user(self, username: str, admin_user: User = Depends(get_current_active_admin_user)):
        self.__management_services.delete_user(admin_user, username)

        return {
            'message': 'ok'
        }
