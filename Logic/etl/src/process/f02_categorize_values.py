import pandas as pd
import sqlalchemy

from src.utils import getters, global_vars


class CategorizeValues:

    __prefix = '02_categorize_values'

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
        self.__log_info('Getting parameters from view...')
        df_filtered_params = getters.get_filtered_params(self.__engine,
                                                         [global_vars.COL_PARAMETRO, 'NM_ANALISE', 'NM_PARAMETRO',
                                                          'VAL_REF'])
        self.__log_info(f'Retrieved {len(df_filtered_params.axes[0])} parameters.')

        self.__log_info('Getting transformed values...')
        with self.__engine.begin() as conn:
            df_transformed_values = getters.get_transformed_values(conn)
        self.__log_info(
            f'Retrieved {len(df_filtered_params.axes[0])} rows and {len(df_filtered_params.axes[1])} '
            f'columns from transformed table...')

        df_cat_values = self.__categorize_values(df_filtered_params, df_transformed_values)

        self.__log_info('Writing to DB...')
        with self.__engine.begin() as conn:
            df_cat_values.to_sql(global_vars.TBL_CAT_VALUES, index=False,
                                 dtype={global_vars.COL_PACIENTE: sqlalchemy.types.Integer},
                                 con=conn, if_exists='replace')
            self.__log_info('Writing to DB complete.')

            self.__log_info(f'Adding primary keys to {global_vars.TBL_CAT_VALUES}...')
            conn.execute(
                f'alter table {global_vars.TBL_CAT_VALUES} add primary key(`{global_vars.COL_PACIENTE}`, `{global_vars.COL_COLHEITA}`);')
        self.__log_info('Execution completed.')

    # Categorizes value if it's with the '<' sign
    def __less_val_ref(self, value, val_ref):
        if not value or pd.isna(value):
            return pd.NA
        elif value < val_ref:
            return "1"
        else:
            return "2"

    # Categorizes value if it's with the '>' sign
    def __high_val_ref(self, value, val_ref):
        if not value or pd.isna(value):
            return pd.NA
        elif value > val_ref:
            return "1"
        else:
            return "2"

    # Categorizes value if it's with the '-' sign
    def __interval_val_ref(self, value, val_ref):
        min_val_ref, max_val_ref = val_ref

        if not value or pd.isna(value):
            return pd.NA
        elif value < min_val_ref:
            return "3"
        elif value > max_val_ref:
            return "4"
        else:
            return "1"

    # Retrieves the parts from the val_ref, in case it's an interval, taking in consideration if the numbers
    # are negative.
    # params:
    #  -> val_ref: str of the val_ref
    # returns:
    #  -> list containing the low and the high part
    def __get_val_ref_parts(self, val_ref: str) -> list:
        val_ref_parts = val_ref.split("-")
        vals = []
        next_is_negative = False
        for val_ref_part in val_ref_parts:
            if len(val_ref_part) == 0:
                if next_is_negative:
                    raise Exception(f'Bad format for VAL_REF: {val_ref}')
                next_is_negative = True
            else:
                vals.append(f'{"-" if next_is_negative else ""}{val_ref_part}')
                next_is_negative = False

        return vals

    def __categorize_value(self, value, param):
        tmp_param = param.replace(" ", "").replace(',', '.')
        if tmp_param[0] == '<':
            val_ref = float(tmp_param[1:])
            res = self.__less_val_ref(value, val_ref)
        elif tmp_param[0] == '>':
            val_ref = float(tmp_param[1:])
            res = self.__high_val_ref(value, val_ref)
        else:
            val_ref_parts = self.__get_val_ref_parts(tmp_param)
            lower_val_ref, higher_val_ref = map(float, val_ref_parts)
            res = self.__interval_val_ref(value, (lower_val_ref, higher_val_ref))

        return res

    def __categorize_values(self, df_params, df_transformed_values):
        cols = len(df_transformed_values.axes[1]) - 2
        self.__log_info(f'Starting categorization of values for {cols} columns...')
        new_vals = {}

        # make ID_PARAMETRO as index, so VAL_REF can be accessed directly with ID_PARAMETRO
        df_params = df_params.set_index(global_vars.COL_PARAMETRO)

        for idx, col in enumerate(df_transformed_values.columns):
            values = df_transformed_values[col]

            # if it's not numeric (i.e. not a parameter) then no transformation required
            if not str(col).isnumeric():
                new_vals[col] = values
            # if the column is a parameter
            else:
                val_ref = df_params['VAL_REF'][int(col)]

                # if parameter has a VAL_REF
                if val_ref:
                    try:
                        values = [self.__categorize_value(value, val_ref) for value in values]
                        new_vals[col] = values
                    except AttributeError as e:
                        self.__log_error(f'ID_PARAM={col} with VAL_REF={val_ref}')
                        raise e
                    self.__log_info(f'Parameters [{idx - 1}-{cols}] with VAL_REF="{val_ref}" completed categorization.')
                # just ignore if it doesn't
                else:
                    self.__log_warning(f'Column "{col}" will not be added because it doesn\'t have a val_ref')

        df_res = pd.DataFrame(new_vals)

        self.__log_info('Categorization complete.')

        return df_res
