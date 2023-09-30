from enum import Enum

from . import global_vars


class MergeTable(Enum):
    CATEGORIC = 1
    NUMERIC = 2


def merge_values(df_merged_ids, merge_table: MergeTable):
    tables = {
        MergeTable.CATEGORIC: global_vars.TBL_CAT_VALUES,
        MergeTable.NUMERIC: global_vars.TBL_TRANSFORMED_FILTERED_VALUES
    }

    return __merge_values_aux(df_merged_ids, tables[merge_table])


def __merge_values_aux(df_merged_ids, merge_table_str: str):
    # create a dict for the merge_ids, where the key is the merge_id and the values
    # are a list of id_params with the same nm_analise and nm_parametro, e.g {`0`: [`84`, `150`]}.
    merged_ids = {}
    for row in df_merged_ids.itertuples():
        merged_id = f'`{row.ID_MERGED}`'
        id_param = f'`{row.ID_PARAMETRO}`'
        if merged_id in merged_ids:
            merged_ids[merged_id].append(id_param)
        else:
            merged_ids[merged_id] = [id_param]

    # define the first part of the query, where it checks for empty strings to convert them to null
    merge_query = f'select {global_vars.COL_PACIENTE}, {global_vars.COL_COLHEITA}, '
    for merge_id in merged_ids.keys():
        merge_query = merge_query + f'if({merge_id} = "", null, {merge_id}) as {merge_id}, '

    merge_query = merge_query[:-2]  # remove last space and comma

    # merged_ids is used for iteration
    merge_query = merge_query + f' from (select {global_vars.COL_PACIENTE}, {global_vars.COL_COLHEITA}'
    for merge_id, id_params in merged_ids.items():

        # if it's only one value, there's no need to use concat and coalesce functions from sql
        if len(id_params) == 1:
            merge_query = merge_query + f', {id_params[0]} as {merge_id}'
        else:
            q = [f'coalesce({v}, ""), ' for v in id_params]
            q = ''.join(q)[:-2]
            merge_query = merge_query + f', concat({q}) as {merge_id}'

    # create the rest of the query, which basically is just the ') as tx' and the MergeTable to merge
    merge_query = merge_query + f' from {merge_table_str}) as T'

    return merge_query
