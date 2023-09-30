import sqlalchemy

from . import global_vars


# gets a connection for the DB
def get_engine():
    print(f"Connecting to %s" % global_vars.CONNECTION_STRING)
    return sqlalchemy.create_engine(f"mariadb+pymysql://%s" % global_vars.CONNECTION_STRING,
                                    echo=False,
                                    pool_pre_ping=True)
