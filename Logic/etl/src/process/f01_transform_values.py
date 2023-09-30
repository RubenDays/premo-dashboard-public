import json

import pandas as pd
import numpy as np
import sqlalchemy

from src.utils import getters, global_vars


class TransformValues:

    __prefix = '01_transform_values'

    __FUNC_RULES = {
        "ignore": lambda x, y: x.replace(y, ""),
        "avg": lambda x, y: str(np.mean([float(a) for a in x.replace(",", ".").split(y)])),
        "null": lambda x, y: None,
    }

    __DATA_TYPE_RULES = {
        "number": lambda x: float(str(x).replace(",", ".")) if can_convert_to_float(x) else None,
    }

    def __init__(self, logger, engine):
        self.__logger = logger
        self.__engine = engine
        self.__RULES = get_rules()

    def __log_info(self, msg: str):
        self.__logger.info(f'[{self.__prefix}] {msg}')

    def __log_warning(self, msg: str):
        self.__logger.warning(f'[{self.__prefix}] {msg}')

    def __log_error(self, msg: str):
        self.__logger.error(f'[{self.__prefix}] {msg}')

    def run(self):
        self.__log_info('Starting execution...')

        # get values from the necessary vars in the view
        self.__log_info('Getting values from view...')
        with self.__engine.begin() as conn:
            df_vals = getters.get_view_values(conn)
        self.__log_info(f'View returned with {len(df_vals.axes[0])} rows and {len(df_vals.axes[1])} columns.')

        cols = [global_vars.COL_PARAMETRO, 'NM_ANALISE', 'NM_PARAMETRO']
        cols.extend([col for col in df_vals.columns if str(col).isnumeric()])

        self.__log_info('Getting parameters...')
        with self.__engine.begin() as conn:
            df_params = getters.get_from_param(conn, cols)
        self.__log_info(f'Retrieved {len(df_params.axes[0])} parameters')

        df_params = df_params.set_index(global_vars.COL_PARAMETRO)

        db_transformed_values = self.__transform_values(df_vals, df_params)

        self.__write_to_db(self.__engine, db_transformed_values)

        self.__log_info(f'Setting primary keys for {global_vars.TBL_TRANSFORMED_FILTERED_VALUES}...')
        with self.__engine.begin() as conn:
            conn.execute(
                f'ALTER TABLE {global_vars.TBL_TRANSFORMED_FILTERED_VALUES} '
                f'ADD PRIMARY KEY (`{global_vars.COL_PACIENTE}`, `{global_vars.COL_COLHEITA}`);')

        self.__log_info('Execution completed.')

    def __apply_transformation_rules(self, rules_key, value):
        new_value = value
        for rule_k, rule_v in rules_key.items():
            if rule_k in value:  # if the key in rules exists in value string
                if rule_v in self.__FUNC_RULES.keys():  # if the rules value exists in the rules functions
                    try:
                        new_value = self.__FUNC_RULES[rule_v](value, rule_k)  # execute the rule function
                    except:
                        self.__log_warning(f'{rule_k}-{rule_v} cant be applied to "{value}"! This transformation will be ignored.')
                else:
                    self.__log_error(f'{rule_k}-{rule_v} does not exist in FUNC_TYPES!')
                    raise Exception(f'{rule_k}-{rule_v} does not exist in FUNC_TYPES!')

        return new_value

    def __apply_result_rule(self, result_rule, value):
        res_type = result_rule["type"]
        res_ifnot = result_rule["ifnot"]
        new_value = value
        if res_type in self.__DATA_TYPE_RULES.keys():  # if type value exists in DATA_TYPE_RULES
            tmp = self.__DATA_TYPE_RULES[res_type](value)
            if not tmp:
                new_value = self.__FUNC_RULES[res_ifnot](value, None)  # execute the rule function
            else:
                new_value = tmp
        else:
            self.__log_error(f'type-{res_type} does not exist in DATA_TYPE_RULES!')
            raise Exception(f'type-{res_type} does not exist in DATA_TYPE_RULES!')

        return new_value

    def __apply_rules(self, rules, value):
        new_value = value
        for i, rules_key in enumerate(rules["transformations"]):
            new_value = self.__apply_transformation_rules(rules_key, new_value)

        new_value = self.__apply_result_rule(rules["result"], new_value)

        return new_value

    def __transform_col_values(self, analise_param, values):
        if analise_param in self.__RULES.keys():
            rules = self.__RULES[analise_param]
        else:
            rules = self.__RULES["all"]

        a = [self.__apply_rules(rules, str(value)) for value in values]

        return a

    def __transform_values(self, df_vals, df_params):
        self.__log_info(f'Transforming values for {len(df_params.axes[1])} columns ...')
        new_vals = {}
        for col in df_vals.columns:
            values = df_vals[col]
            if str(col).isnumeric():
                # create lower case key 'nm_analise|nm_parametro'
                analise_param = f'{str(df_params["NM_ANALISE"][int(col)]).lower()}|{str(df_params["NM_PARAMETRO"][int(col)]).lower()}'
                try:
                    values = self.__transform_col_values(analise_param, values)
                except Exception as e:
                    self.__log_error(f'col={col} with analise_param={analise_param} resulted in error')
                    raise e
            new_vals[col] = values

        df_res = pd.DataFrame(new_vals)
        self.__log_info(f'Data transformation completed.')
        return df_res

    # insert values to db
    # will be inserted in batches of 8 million cells (row * col) max at a time
    def __write_to_db(self, engine, db_transformed_values):
        max_per_call = 8_000_000  # 8 million

        rows = len(db_transformed_values.axes[0])
        cols = len(db_transformed_values.axes[1])
        remaining_in_df = rows * cols

        self.__log_info(f'Writing {remaining_in_df} cells to DB (rows x cols = {rows} x {cols}), '
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
                df = db_transformed_values.iloc[last_row:last_row + max_lines_per_call, :]
                last_row = last_row + max_lines_per_call
                self.__log_info(f'Writing {max_lines_per_call} lines to DB...')
            else:
                self.__log_info(f'Writing {rows_left} lines to DB...')
                rows_left = 0
                df = db_transformed_values.iloc[last_row:, :]

            # removes all rows that have all parameters with NULL (except the IDs)
            df_to_write = df.set_index([global_vars.COL_PACIENTE, global_vars.COL_COLHEITA])\
                .dropna(how='all')\
                .reset_index()
            self.__log_info(f'{len(df.axes[0]) - len(df_to_write.axes[0])} NULL lines removed.')

            with engine.begin() as conn:
                if table_created:
                    df_to_write.to_sql(global_vars.TBL_TRANSFORMED_FILTERED_VALUES,
                            dtype={"ID_PACIENTE": sqlalchemy.types.Integer},
                            index=False, con=conn, if_exists='append')
                else:
                    df_to_write.to_sql(global_vars.TBL_TRANSFORMED_FILTERED_VALUES,
                             dtype={"ID_PACIENTE": sqlalchemy.types.Integer},
                             index=False, con=conn, if_exists='replace')
                    table_created = True

        self.__log_info('Writing to DB completed.')


def can_convert_to_float(number):
    if not number:
        return False

    try:
        if type(number) is str:
            float(number.replace(",", "."))
        else:
            float(number)
        return True
    except:
        return False


# gets the content of the file 'rules.json'
def get_rules():
    with open(f'{global_vars.CONFIGS_BASE}/rules.json', 'r') as f:
        return json.load(f)
