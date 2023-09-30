from fastapi import APIRouter, Response, Depends
from fastapi.security import OAuth2PasswordRequestForm

from src.dto.UserModels import User
from src.services.SecurityServices import get_current_active_user, generate_tokens, renew_tokens
from src.utils.logger import get_app_logger
from src.services.servicesInterfaces.InitDataServInt import InitDataServInt


class AuthRouter(APIRouter):

    def __init__(self, init_data_services: InitDataServInt):
        self.__logger = get_app_logger()
        self.__init_data_services = init_data_services
        super().__init__(prefix='/auth', tags=['auth'])

        super().add_api_route(path='/token', endpoint=self.login_user, methods=['POST'])
        super().add_api_route(path='/verify', endpoint=self.verify_user, methods=['GET'])
        super().add_api_route(path='/logout', endpoint=self.logout_user, methods=['POST'])
        super().add_api_route(path='/refresh-token', endpoint=self.renew_token, methods=['POST'])

    # @app.post('/auth/token')
    def login_user(self, response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
        user, access_token, refresh_token = generate_tokens(form_data)
        data = self.__init_data_services.get_init_data()

        response.set_cookie(key='access_token', value=f'Bearer {access_token}', httponly=True)
        response.set_cookie(key='refresh_token', value=f'Bearer {refresh_token}', httponly=True)
        return {
            'session': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer',
                'user': form_data.username,
                'role': user.role
            },
            'data': data
        }

    # POST /auth/refresh-token
    def renew_token(self, response: Response, user: User = Depends(get_current_active_user)):
        access_token, refresh_token = renew_tokens(user.username)
        data = self.__init_data_services.get_init_data()

        response.set_cookie(key='access_token', value=f'Bearer {access_token}', httponly=True)
        response.set_cookie(key='refresh_token', value=f'Bearer {refresh_token}', httponly=True)
        return {
            'session': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer',
                'user': user.username,
                'role': user.role
            },
            'data': data
        }

    # GET /auth/verify
    def verify_user(self, user: User = Depends(get_current_active_user)):
        self.__logger.info('verify-auth called')
        data = self.__init_data_services.get_init_data()
        self.__logger.info('verify-auth called ended')
        return {
            'session': {
                'user': user.username,
                'role': user.role
            },
            'data': data
        }

    # @app.post('/auth/logout')
    def logout_user(self, response: Response, user: User = Depends(get_current_active_user)):
        self.__logger.info('logout called')
        response.delete_cookie(key='access_token')
        response.delete_cookie(key='refresh_token')
        self.__logger.info('logout ended')
        return {'message': 'ok'}
