import json
import pandas as pd

from src.utils.getters import get_columns_from_table
from src.utils import global_vars


class MinMaxResultsCat:
    __prefix = '08_min_max_results_cat'

    def __init__(self, logger, engine):
        self.__logger = logger
        self.__engine = engine

    def __log_info(self, msg: str):
        self.__logger.info(f'[{self.__prefix}] {msg}')

    def __log_warning(self, msg: str):
        self.__logger.warning(f'[{self.__prefix}] {msg}')

    def __log_error(self, msg: str):
        self.__logger.error(f'[{self.__prefix}] {msg}')

    def run(self):
        self.__log_info('Starting execution...')
        self.__log_info(f'Extracting rules from "max-min-cat.json"...')
        cat_rules = self.__get_rules()

        # creates the 'where' part of the query to extract only the parameters needed.
        where_query = ''
        for param in list(cat_rules.keys()):
            param_parts = param.split('|')
            nm_analise, nm_param = param_parts[0], param_parts[1]
            where_query = where_query + f' NM_ANALISE="{nm_analise}" and NM_PARAMETRO="{nm_param}" or'
        where_query = where_query[:-2]  # remove last 'OR'

        # Extracts the parameters that will be categorized
        self.__log_info(f'Extrating parameters to categorize...')
        with self.__engine.begin() as conn:
            df_params = pd.read_sql_query(
                f'select ID_MERGED, NM_ANALISE, NM_PARAMETRO from v_param_merged where {where_query}', conn)

        # Gets the names of the columns of the patient data
        self.__log_info(f'Extracting columns from {global_vars.V_PATIENT_DATA}...')
        with self.__engine.begin() as conn:
            patient_data_cols = get_columns_from_table(conn, 'v_patient_data')
        self.__log_info(f'Extracted {len(patient_data_cols)}.')

        # Adds DT_COLHEITA because it's the date that will be used and not DATA_COLHEIA
        patient_data_cols.append('DT_COLHEITA')

        # Generates the query
        self.__log_info(f'Generating query to create {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT_CAT}...')
        query = self.__create_min_max_cat_view_query(patient_data_cols, df_params, cat_rules)
        self.__log_info('Query created.')

        # Drops and creates the view
        with self.__engine.begin() as conn:
            self.__log_info(f'Dropping view {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT_CAT}...')
            conn.execute(f'drop view if exists {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT_CAT}')
            self.__log_info(f'Creating view {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT_CAT}...')
            conn.execute(query)

        self.__log_info('Execution ended')

    # reads the content of 'max-min-cat.json' which contains the categorization rules for some parameters.
    # returns -> a dict with the rules
    def __get_rules(self):
        with open(f'{global_vars.CONFIGS_BASE}/max-min-cat.json', 'r') as f:
            return json.load(f)

    def __case_condition(self, rule_k: str) -> str:
        r = rule_k.replace(' ', '')
        if '-' in r:
            intervals = r.split('-')
            return f'between {intervals[0]} and {intervals[1]}'

        symbols = ['<=', '<', '>=', '>']
        for symbol in symbols:
            if symbol in r:
                val = r.replace(symbol, '')
                return f'{symbol} {val}'

    def __create_col_case(self, col_name: str, rules: list) -> str:
        query = 'case '
        for rule in rules:
            rule_k = list(rule.keys())[0]
            rule_v = rule[rule_k]
            query = query + f'when {col_name} {self.__case_condition(rule_k)} then {rule_v} '

        return query + f'end as {col_name}_cat'

    # Generates the query to create the view
    # params -> patient_data_cols: list of the column names of the patient data
    #        -> df_params: df containing the ID_MERGED, NM_ANALISE and NM_PARAMETRO of the parameters that will
    #        be categorized
    #        -> cat_rules: rules for categorization
    def __create_min_max_cat_view_query(self, patient_data_cols, df_params, cat_rules):
        query = f'create view {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT_CAT} as select ' + ', '.join(patient_data_cols) + ", "

        df_params = df_params.set_index(['NM_ANALISE', 'NM_PARAMETRO'])

        measure_cols_to_select = []
        for key, val in cat_rules.items():
            k = key.split('|')
            id_merged = df_params.loc[tuple(k)]['ID_MERGED']
            for v in val:
                measure = v['measure']
                col_name = f'dia_{measure}_{id_merged}'
                measure_cols_to_select.append(self.__create_col_case(col_name, v['rules']))

        query = query + ', '.join(measure_cols_to_select) + f' from {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT}'

        return query
