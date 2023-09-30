from src.dto.DataModels import FetchUsersParams, UpdateUserBody
from src.dto.UserModels import User


class ManagementServicesInt:

    def create_user(self, new_user: User):
        raise Exception('ManagementServicesInt.create_user: Not implemented.')

    def search_users(self, query_params: FetchUsersParams):
        raise Exception('ManagementServicesInt.create_user: Not implemented.')

    def update_user(self, admin_user: User, username: str, body: UpdateUserBody):
        raise Exception('ManagementServicesInt.update_user: Not implemented.')

    def delete_user(self, admin_user: User, username: str):
        raise Exception('ManagementServicesInt.delete_user: Not implemented.')
