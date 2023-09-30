from typing import Any

from fastapi import FastAPI, Request
from starlette import status
from starlette.responses import JSONResponse

from src.exceptions.CustomExceptions import NotFoundException, UnauthorizedException, UnsupportedMediaTypeException, \
    BadRequestException, GatewayTimeoutException
from src.utils.logger import get_app_logger


class MyFastAPI(FastAPI):

    def __init__(self, **extra: Any):
        super().__init__(**extra)
        logger = get_app_logger()

        @self.exception_handler(NotFoundException)
        def unicorn_exception_handler(request: Request, exc: NotFoundException):
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": f"Oops! {exc.name} did something. There goes {exc.tipo} rainbows... "},
            )

        @self.exception_handler(UnauthorizedException)
        def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
            logger.info(f'UnauthorizedException: {exc.detail}')
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                headers=exc.headers,
                content={'detail': exc.detail}
            )

        @self.exception_handler(UnsupportedMediaTypeException)
        def unsupported_media_type_exception_handler(request: Request, exc: UnsupportedMediaTypeException):
            return JSONResponse(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                content={"message": "Unsupported type"}
            )

        @self.exception_handler(BadRequestException)
        def unsupported_media_type_exception_handler(request: Request, exc: BadRequestException):
            logger.info(f'BadRequestException: {exc.content}')
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=exc.content
            )

        @self.exception_handler(GatewayTimeoutException)
        def gateway_timeout_exception(request: Request, exc: GatewayTimeoutException):
            logger.error(f'Gateway Timeout Exception: {exc.content}')
            return JSONResponse(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                content=exc.content
            )

        @self.exception_handler(Exception)
        def internal_server_exception_handler(request: Request, exc: Exception):
            logger.exception('Internal Server Exception')
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={'detail': 'Server encountered an error'}
            )
