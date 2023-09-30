import pandas as pd

from . import global_vars


# gets all the values from v_filtered
# select * from V_FILTERED [after_from]
def get_view_values(conn, after_from=''):
    return pd.read_sql_query(f'select * from {global_vars.V_FILTERED} {after_from}', conn)


# gets all the values of the given attributes from table PARAMETRO
def get_from_param(conn, attrs: list, after_from=''):
    return pd.read_sql_query(f'select {", ".join(attrs)} from {global_vars.TBL_PARAMETRO} {after_from}', conn)


# gets the merged ids
def get_merged_ids(conn):
    return pd.read_sql_query(f'select ID_PARAMETRO, ID_MERGED from {global_vars.TBL_MERGED_IDS_PARAMS}', conn)


# gets all the values after being transformed
def get_transformed_values(conn):
    return pd.read_sql_query(f'select * from {global_vars.TBL_TRANSFORMED_FILTERED_VALUES}', conn)


# gets the values with the attrs from PARAMETRO, for those that have been filtered in V_FILTERED
def get_filtered_params(engine, attrs: list):
    with engine.begin() as conn:
        df_v_filtered = get_view_values(conn, 'limit 1')
    
    param_columns = [v for v in df_v_filtered.columns if str(v).isnumeric()]
    query = 'where'
    for column in param_columns:
        query = query + f' {global_vars.COL_PARAMETRO}={column} OR'

    query = query[:-3]

    with engine.begin() as conn:
        return get_from_param(conn, attrs, query)


# returns a list of the columns of the given table
def get_columns_from_table(conn, tbl_name: str) -> list:
    df = pd.read_sql_query(f'select * from {tbl_name} limit 1;', conn)
    df_cols = list(df.columns.values)
    return df_cols