class NotFoundException(Exception):
    def __init__(self, name: str, tipo: int):
        self.name = name
        self.tipo = tipo


class UnsupportedMediaTypeException(Exception):
    def __init__(self, name: str, tipo: int):
        self.name = name
        self.tipo = tipo


class UnauthorizedException(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        self.headers = {'WWW-Authenticate': 'Bearer'}


class BadRequestException(Exception):
    def __init__(self, content: {}):
        self.content = content


class InvalidCredentialsException(BadRequestException):
    def __init__(self, detail: str):
        super().__init__(detail)


class GatewayTimeoutException(Exception):
    def __init__(self, content: {}):
        self.content = content
