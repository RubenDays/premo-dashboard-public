class MyLogger:

    def __init__(self, logger, prefix: str):
        self.__logger = logger
        self.__prefix = prefix

    def info(self, msg: str):
        self.__logger.info(f'[{self.__prefix}] {msg}')

    def warning(self, msg: str):
        self.__logger.warning(f'[{self.__prefix}] {msg}')

    def error(self, msg: str):
        self.__logger.error(f'[{self.__prefix}] {msg}')