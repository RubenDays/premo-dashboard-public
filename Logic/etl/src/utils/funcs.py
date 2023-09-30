# removes duplicates from mem_df that exists in db_df by comparing the keys
# params:
#   -> db_df: Dataframe that contains the data that is present in DB
#   -> mem_df: Dataframe that contains the new data to be inserted
#   -> keys: list[str] that contains the column names to compare duplicates
def remove_duplicate_rows(db_df, mem_df, keys):
    existing_idx = db_df.set_index(keys).index
    to_ins_idx = mem_df.set_index(keys).index

    mask = ~to_ins_idx.isin(existing_idx)
    df_3 = mem_df.loc[mask]  # removes existing rows from mem_df that already exists in db_df

    return df_3
