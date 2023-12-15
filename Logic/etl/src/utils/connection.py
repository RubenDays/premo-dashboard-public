import sqlalchemy
from sqlalchemy.exc import ProgrammingError

from . import global_vars


PYMYSQL_ENGINE = "pymysql"
MARIADB_ENGINE = "mariadbconnector"
ENGINE_NAME = PYMYSQL_ENGINE


# gets a connection for the DB
def get_engine():
    print(f"Connecting to %s" % global_vars.CONNECTION_STRING)
    return sqlalchemy.create_engine(f"mariadb+{ENGINE_NAME}://%s" % global_vars.CONNECTION_STRING,
                                    echo=False,
                                    pool_pre_ping=True)


def get_sqlalchemy_error(e: ProgrammingError):
    if ENGINE_NAME == PYMYSQL_ENGINE:
        code, error = e.orig.args
        return code
    elif ENGINE_NAME == MARIADB_ENGINE:
        return e.orig.errno

    raise Exception('Bad engine selected')
