import os
import logging
import sys
from datetime import date
from . import global_vars


def get_logger(filename: str, folder: str = None, separate_by_date: bool = True, verbose: bool = False):
    root_dir = global_vars.LOGS_BASE
    print(root_dir)
    if separate_by_date:
        tmp_name = filename.split(".")
        filename = f'{tmp_name[0]}_{date.today()}.{tmp_name[1]}'

    if folder:
        file_dir = f'{root_dir}/{folder}'
        if not os.path.exists(file_dir):
            os.makedirs(file_dir)
        file_path = f'{file_dir}/{filename}'
    else:
        file_path = f'{root_dir}/{filename}'

    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(file_path),
        ]
    )

    info_logger = logging.getLogger("infologger")
    if verbose:
        info_logger.setLevel(logging.DEBUG)
    else:
        info_logger.setLevel(logging.INFO)

    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))

    info_logger.addHandler(sh)

    if verbose:
        logging.getLogger('sqlalchemy').addHandler(sh)
        logging.getLogger('sqlalchemy').setLevel(logging.INFO)
    else:
        logging.getLogger('sqlalchemy').setLevel(logging.INFO)

    # just to separate executions
    info_logger.info("\n\n\n----------------------------------------------------------------------------\n\n")
    return info_logger
