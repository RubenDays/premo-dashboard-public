from src.dto.DataModels import FetchUsersDAL, UpdateUserDAL
from src.dto.UserModels import UserInDB


class UserDALInterface:

    # Retrieves user with the 'username'.
    def get_user(self, username: str):
        raise Exception('UserDALInterface.get_user Not Implemented')

    def create_user(self, new_user: UserInDB):
        raise Exception('UserDALInterface.create_user Not Implemented')

    def fetch_users(self, fetch_users_dal: FetchUsersDAL):
        raise Exception('UserDALInterface.fetch_users Not Implemented')

    def update_user(self, upd_user_dal: UpdateUserDAL):
        raise Exception('UserDALInterface.update_user Not Implemented')

    def delete_user(self, username: str):
        raise Exception('UserDALInterface.delete_user Not Implemented')
