import os
import logging
import sys
from datetime import date

from src.utils.singleton import singleton

log_formater_str = "%(asctime)s [%(levelname)s]: %(message)s"


class MyLogger:

    def __init__(self, logger):
        self.__logger = logger

    def info(self, msg: str, user: str | None = None):
        if user:
            self.__logger.info('[%s] - %s', user, msg)
        else:
            self.__logger.info('[%s] - %s', '', msg)

    def warning(self, msg: str, user: str | None = None):
        if user:
            self.__logger.warning('[%s] - %s', user, msg)
        else:
            self.__logger.warning('[%s] - %s', '', msg)

    def error(self, msg: str, user: str | None = None):
        if user:
            self.__logger.error('[%s] - %s', user, msg)
        else:
            self.__logger.error('[%s] - %s', '', msg)

    def exception(self, msg: str, user: str | None = None):
        if user:
            self.__logger.exception('[%s] - %s', user, msg)
        else:
            self.__logger.exception('[%s] - %s', '', msg)



@singleton
class Logger:

    def __init__(self, filename: str, folder: str = None, separate_by_date: bool = True, verbose: bool = False):
        root_dir = './logs'

        # add date to filename if separate by date is True
        if separate_by_date:
            tmp_name = filename.split(".")
            filename = f'{tmp_name[0]}_{date.today()}.{tmp_name[1]}'

        # if there's a folder, create it if it doesn't exist. Then create the file
        if folder:
            file_dir = f'{root_dir}/{folder}'
            if not os.path.exists(file_dir):
                os.makedirs(file_dir)
            file_path = f'{file_dir}/{filename}'
        else:
            file_path = f'{root_dir}/{filename}'

        # basic config for all loggers. Write in file
        logging.basicConfig(
            level=logging.DEBUG,
            format=log_formater_str,
            handlers=[
                logging.FileHandler(file_path),
            ]
        )

        # Create/get infologger logger
        info_logger = logging.getLogger("infologger")
        logging.getLogger()
        info_logger.setLevel(logging.DEBUG)

        info_logger_stdout_hdlr_name = 'stdout'

        # if it doesn't have, then create stdout handler and adds the formatter
        sh = logging.StreamHandler(sys.stdout)
        sh.name = info_logger_stdout_hdlr_name
        sh.setFormatter(logging.Formatter(log_formater_str))

        info_logger.addHandler(sh)

        # verifies if it's verbose and changes sqlalchemy logger accordingly
        if verbose:
            logging.getLogger('sqlalchemy').addHandler(sh)
            logging.getLogger('sqlalchemy').setLevel(logging.INFO)
        else:
            logging.getLogger('sqlalchemy').setLevel(logging.INFO)

        info_logger.debug("\n\n\n----------------------------------------------------------------------------\n\n")

        self.info_logger = MyLogger(info_logger)


def get_app_logger():
    return Logger('api.txt').info_logger
