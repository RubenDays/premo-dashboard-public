# libs not mine
import yaml
from typing import Optional, Dict
from fastapi.security.utils import get_authorization_scheme_param
from datetime import datetime, timedelta
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, OAuth2
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from passlib.context import CryptContext
from jose import JWTError, jwt

# DAL
from src.dal.dalSpecific.UserDAL import UserDAL

# DTOs
from src.dto.UserModels import User, UserInDB

# Others
from src.utils.connection import create_default_engine_helper
from src.exceptions.CustomExceptions import InvalidCredentialsException, UnauthorizedException
from src.utils.logger import get_app_logger
from src.services import security


class OAuth2PasswordBearerCookie(OAuth2):

    def __init__(
            self,
            tokenUrl: str,
            scheme_name: Optional[str] = None,
            scopes: Optional[Dict[str, str]] = None,
            auto_error: bool = True,
    ):
        if not scopes:
            scopes = {}
        flows = OAuthFlowsModel(password={"tokenUrl": tokenUrl, "scopes": scopes})
        super().__init__(flows=flows, scheme_name=scheme_name, auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[str]:
        authorization: str = request.cookies.get("access_token")  # changed to accept access token from httpOnly Cookie
        print("access_token is", authorization)

        scheme, param = get_authorization_scheme_param(authorization)
        if not authorization or scheme.lower() != "bearer":
            if self.auto_error:
                raise UnauthorizedException(detail="Not authenticated")
            else:
                return None
        return param


# oauth2 schemes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth2_scheme_cookie = OAuth2PasswordBearerCookie(tokenUrl="token")


# instances
engineHelper = create_default_engine_helper()
engine = engineHelper.get_engine()
userDal = UserDAL(engine)

logger = get_app_logger()


def __get_current_user(token: str = Depends(oauth2_scheme_cookie)) -> UserInDB:
    unauthorized_exception = UnauthorizedException(detail='Invalid authentication credentials')
    try:
        logger.info(f'Retrieving user from token "{token}"...')
        payload = jwt.decode(token, security.secret_key, algorithms=[security.algorithm])
        username: str = payload.get('sub')
        if username is None:
            logger.info(f'User not present in token "{token}".')
            raise unauthorized_exception
        logger.info(f'User is "{username}".')
    except JWTError:
        logger.info(f'Error decoding token "{token}".')
        raise unauthorized_exception

    logger.info(f'Retrieving user "{username}"...')
    user = userDal.get_user(username)
    if not user:
        logger.info(f'User "{username}" does not exist.')
        raise unauthorized_exception

    return user


def get_current_active_user(current_user: User = Depends(__get_current_user)) -> User:
    if not current_user.enabled:
        logger.info(f'User "{current_user.username}" is disabled.')
        raise InvalidCredentialsException(detail='User is inactive')

    return current_user


def get_current_active_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if not current_user.role == 'admin':
        logger.info(f'User "{current_user.username}" is not admin.')
        raise InvalidCredentialsException(detail='User is not admin')

    return current_user


def __verify_password(password: str, hashed_password: str):
    return security.pwd_context.verify(password, hashed_password)


def __authenticate_user(username: str, password: str):
    logger.info(f'Authenticating user "{username}"...')
    user: UserInDB = userDal.get_user(username)
    if not user:
        logger.info(f'User "{username}" does not exist.')
        return False
    if not user.enabled:
        logger.info(f'User "{username}" is disabled.')
        return False
    if not __verify_password(password, user.hashed_password):
        logger.info(f'Wrong password for user "{username}".')
        return False

    return user


def generate_token(username: str, expire_mins: float) -> str:
    token_expiration = timedelta(minutes=expire_mins)
    data = {
        'sub': username,
        'exp': datetime.utcnow() + token_expiration
    }
    token: str = jwt.encode(data, security.secret_key, algorithm=security.algorithm)
    return token


def generate_tokens(form_data: OAuth2PasswordRequestForm) -> tuple:
    logger.info(f'generating token for "{form_data.username}"')
    user = __authenticate_user(form_data.username, form_data.password)
    if not user:
        raise InvalidCredentialsException(detail='Incorrect username or password')

    logger.info(f'User "{form_data.username}" authenticated.')
    access_token = generate_token(form_data.username, security.access_token_expire_mins)
    refresh_token = generate_token(form_data.username, security.refresh_token_expire_mins)

    return user, access_token, refresh_token


def renew_tokens(username: str) -> tuple:
    logger.info(f'generating token for "{username}"')

    access_token = generate_token(username, security.access_token_expire_mins)
    refresh_token = generate_token(username, security.refresh_token_expire_mins)

    return access_token, refresh_token
