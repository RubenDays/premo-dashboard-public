# removes duplicates from mem_df that exists in db_df by comparing the keys
# params:
#   -> db_df: Dataframe that contains the data that is present in DB
#   -> mem_df: Dataframe that contains the new data to be inserted
#   -> keys: list[str] that contains the column names to compare duplicates
import os
import sqlalchemy


def remove_duplicate_rows(db_df, mem_df, keys):
    existing_idx = db_df.set_index(keys).index
    to_ins_idx = mem_df.set_index(keys).index

    mask = ~to_ins_idx.isin(existing_idx)
    df_3 = mem_df.loc[mask]  # removes existing rows from mem_df that already exists in db_df

    return df_3


def get_patient_id(fn):
    try:
        return int(os.path.basename(fn.split('.')[0]))
    except:
        return None


def write_to_db_batches(conn, df_to_ins, tbl_name, logger, max_per_call=5_000_000, types=None):
    rows = len(df_to_ins.axes[0])
    cols = len(df_to_ins.axes[1])
    remaining_in_df = rows * cols

    logger.info(f'Writing {remaining_in_df} cells to DB (rows x cols = {rows} x {cols}), '
                f'in batches of max {max_per_call} cells...')

    # number of lines to be inserted at a time
    max_lines_per_call = int(max_per_call / cols)

    # rows left to insert
    rows_left = rows

    last_row = 0
    table_created = False
    while rows_left > 0:
        if max_lines_per_call < rows_left:
            rows_left = rows_left - max_lines_per_call
            df = df_to_ins.iloc[last_row:last_row + max_lines_per_call, :]
            last_row = last_row + max_lines_per_call
            logger.info(f'Writing {max_lines_per_call} lines to DB...')
        else:
            logger.info(f'Writing {rows_left} lines to DB...')
            rows_left = 0
            df = df_to_ins.iloc[last_row:, :]

        # with engine.begin() as conn:
        if table_created:
            df.to_sql(tbl_name,
                      dtype=types,
                      index=False, con=conn, if_exists='append')
        else:
            df.to_sql(tbl_name,
                      dtype=types,
                      index=False, con=conn, if_exists='replace')
            table_created = True

    logger.info('Writing to DB completed.')


def transform_tbl_big_ints_to_ints(df):
    types = {}
    for col in df.columns.values.tolist():
        if df[col].dtype == 'int64':
            types[col] = sqlalchemy.INT

    return types
