from src.dal.dalInterfaces.UserDALInterface import UserDALInterface
from src.dto.DataModels import FetchUsersParams, FetchUsersDAL, UpdateUserBody, UpdateUserDAL
from src.dto.UserModels import User, UserInDB
from src.exceptions.CustomExceptions import BadRequestException
from src.services import security
from src.services.servicesInterfaces.ManagementServicesInt import ManagementServicesInt
from src.utils.verifications import is_valid_username, is_positive_number, is_number_greater_than


class ManagementServices(ManagementServicesInt):

    __valid_roles = ['admin', 'user']
    __empty_user_response = {
        "page": 1,
        "max_pages": 1,
        "users": []
    }

    def __init__(self, user_dal: UserDALInterface):
        self.__user_dal = user_dal

    def search_users(self, query_params: FetchUsersParams):
        print(query_params)
        # username: Union[str, None]
        # page: Union[str, None]
        # max_per_page: Union[str, None]

        fetch_users_dal = FetchUsersDAL()

        # verifications #########################################################################################
        # if username is present and is not valid then return an empty list
        if query_params.username and not is_valid_username(query_params.username):
            return self.__empty_user_response
        # if username is present and valid
        elif query_params.username:
            fetch_users_dal.username = query_params.username

        # if page is valid
        if is_number_greater_than(query_params.page, 0):
            # set it
            fetch_users_dal.page = int(query_params.page)

        # if max per page is valid
        if is_number_greater_than(query_params.max_per_page, 0):
            # set it
            fetch_users_dal.max_per_page = int(query_params.max_per_page)

        # fetch from db #########################################################################################
        users_df, max_pages = self.__user_dal.fetch_users(fetch_users_dal)
        if users_df is None:
            return self.__empty_user_response

        # build response ########################################################################################
        users = []
        for row in users_df.itertuples():
            users.append({
                'username': row.utilizador,
                'role': row.role,
                'enabled': row.ativo == 1
            })

        return {
            "page": fetch_users_dal.page,
            "max_pages": max_pages,
            "users": users
        }

    def create_user(self, new_user: User):
        errors = {}

        # verify new user
        # verify username
        if is_valid_username(new_user.username):
            existing_user = self.__user_dal.get_user(username=new_user.username)
            if existing_user:
                errors['username'] = 'invalid input'
        else:
            errors['username'] = 'invalid input'

        # verify password
        if new_user.role not in self.__valid_roles:
            errors['role'] = 'invalid input'

        # raise if failed verifications
        if len(errors) > 0:
            raise BadRequestException(content=errors)

        # create user for dal
        new_user_dict = {
            'username': new_user.username,
            'role': new_user.role,
            'enabled': new_user.enabled,
            'hashed_password': security.pwd_context.hash(security.default_password)
        }
        new_userdb = UserInDB(**new_user_dict)

        # create user
        self.__user_dal.create_user(new_userdb)

        # return

    def update_user(self, admin_user: User, username: str, body: UpdateUserBody):
        # verifications
        errors = {}

        if admin_user == username or username != body.username or not is_valid_username(username):
            errors['username'] = 'Invalid username'

        if body.role not in self.__valid_roles:
            errors['role'] = 'Invalid role'

        if body.enabled != 'False' and body.enabled != 'True':
            errors['enabled'] = 'Invalid value'

        if body.reset_pwd != 'False' and body.reset_pwd != 'True':
            errors['reset_pwd'] = 'Invalid value'

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        # build dal object
        upd_user_dal = UpdateUserDAL()
        upd_user_dal.username = username
        upd_user_dal.role = body.role
        upd_user_dal.enabled = body.enabled == 'True'
        if body.reset_pwd == 'True':
            upd_user_dal.pwd = security.pwd_context.hash(security.default_password)

        # db query
        self.__user_dal.update_user(upd_user_dal)

        # return

    def delete_user(self, admin_user: User, username: str):
        # verifications
        errors = {}

        if admin_user == username or not is_valid_username(username):
            errors['username']: 'Invalid username'

        if len(errors) > 0:
            raise BadRequestException(content=errors)

        # db query
        self.__user_dal.delete_user(username)

        # return
