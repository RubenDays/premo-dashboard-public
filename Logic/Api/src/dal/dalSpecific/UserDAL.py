import pandas as pd
import sqlalchemy
from sqlalchemy.future import Engine
from sqlalchemy import insert

from src.dto.DataModels import FetchUsersDAL, UpdateUserDAL
from src.dto.UserModels import UserInDB, User
from src.dal.dalInterfaces.UserDALInterface import UserDALInterface
from src.utils import global_vars
from src.utils.logger import get_app_logger


class UserDAL(UserDALInterface):

    def __init__(self, engine: Engine):
        self.__engine = engine
        self.__logger = get_app_logger()

    def __get_user_from_row(self, row: tuple):
        username, password, active, role = row
        return {
            'username': username, 'hashed_password': password, 'enabled': active == 1, 'role': role
        }

    def get_user(self, username: str):
        with self.__engine.connect() as conn:
            res = pd.read_sql_query(f'select utilizador, senha, ativo, role from {global_vars.TBL_LOGIN} where utilizador = "{username}";', conn)

        if len(res.axes[0]) > 0:
            user_dict = self.__get_user_from_row(res.iloc[0])
            user = UserInDB(**user_dict)
            return user

        return None

    def create_user(self, new_user: UserInDB):
        stmt = f'insert into login values (%s, %s, %s, %s)'

        with self.__engine.begin() as conn:
            conn.execute(stmt, (new_user.username, new_user.hashed_password, new_user.enabled, new_user.role))

    def fetch_users(self, fetch_users_dal: FetchUsersDAL):
        count_stmt = f'select count(*) as total from login '
        select_stmt = f'select utilizador, role, ativo from login '

        if fetch_users_dal.username:
            user_stmt = f'where utilizador like "%{fetch_users_dal.username}%" '
            count_stmt = count_stmt + user_stmt
            select_stmt = select_stmt + user_stmt

        with self.__engine.begin() as conn:
            # get number of total users
            count_df = pd.read_sql_query(sql=count_stmt, con=conn)

            # calculate number of pages
            count = count_df['total'].iloc[0]
            page_tmp = count / fetch_users_dal.max_per_page
            int_page = int(page_tmp)
            max_pages = int_page + 1 if int_page < page_tmp else int_page
            # return empty if page required is greater than max (prevents doing more queries)
            if fetch_users_dal.page > max_pages:
                return None

            # calculate offset
            offset = (fetch_users_dal.page - 1) * fetch_users_dal.max_per_page
            # generate the rest of the statement
            select_stmt = select_stmt + f'limit {fetch_users_dal.max_per_page} offset {offset}'
            # get users
            users_df = pd.read_sql_query(sql=select_stmt, con=conn)

        return users_df, max_pages

    def update_user(self, upd_user_dal: UpdateUserDAL):
        params = {
            'pAtivo': 1 if upd_user_dal.enabled else 0,
            'pRole': upd_user_dal.role,
            'pUtilizador': upd_user_dal.username
        }
        query = 'update login set ativo=:pAtivo, role=:pRole '

        if upd_user_dal.pwd:
            query = query + f', senha=:pSenha '
            params['pSenha'] = upd_user_dal.pwd

        query = query + f'where utilizador = :pUtilizador'
        stmt_text = sqlalchemy.text(query)

        with self.__engine.begin() as conn:
            conn.execute(stmt_text, params)

    def delete_user(self, username: str):
        params = {'pUtilizador': username}
        query = 'delete from login where utilizador = :pUtilizador'

        stmt_text = sqlalchemy.text(query)

        with self.__engine.begin() as conn:
            conn.execute(stmt_text, params)
