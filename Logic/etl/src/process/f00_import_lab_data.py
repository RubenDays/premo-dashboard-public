import os
from logging import Logger
from zipfile import ZipFile
import pandas as pd
import numpy as np
import sqlalchemy
from time import perf_counter
from sqlalchemy.future import Engine

from src.utils.funcs import remove_duplicate_rows
from src.utils.global_vars import TBL_RESULTADO, TBL_COLHEITA, TBL_PARAMETRO, COL_PARAMETRO, COL_COLHEITA, COL_PACIENTE


class ImportLabData:
    __CHAVE_PARAM = ['NM_ANALISE', 'NM_PARAMETRO', 'PRODUTO', 'VAL_REF', 'UNIDADES', 'GRUPO']
    __prefix = '00-import_lab_data'

    def __init__(self, logger: Logger, archived_data: ZipFile, engine: Engine):
        self.__logger = logger
        self.__data = archived_data
        self.__engine = engine

    def __log_info(self, msg: str):
        self.__logger.info(f'[{self.__prefix}] {msg}')

    def __log_warning(self, msg: str):
        self.__logger.warning(f'[{self.__prefix}] {msg}')

    def __log_error(self, msg: str):
        self.__logger.error(f'[{self.__prefix}] {msg}')

    # Auxiliary functions
    def __get_patient_id(self, fn):
        return int(os.path.basename(fn.split('.')[0]))

    def __import_patient(self, file, index=0):
        try:
            table = pd.read_excel(file, sheet_name=index)
        except ValueError:
            self.__log_warning(f"({file}) Ficheiro vazio ou corrompido")
            return pd.DataFrame()

        # Removes header if exists
        if not table.empty and table.iloc[0].isnull().values.all():
            table = table.drop([0])

        return pd.DataFrame() if table.empty else self.__normalize_data(table)

    def __normalize_result(self, x):
        return ''.join(x.strip().splitlines()).replace('"', '') if isinstance(x, str) else str(x)

    def __normalize_data(self, df):
        # 'PRODUTO': existem alguns casos em que existe mais do que um para a mesma colheita...
        COLS_STRING = ['SERVICO_REQ', 'NM_ANALISE', 'NM_PARAMETRO', 'PRODUTO', 'UNIDADES', 'VAL_REF', 'RESULTADO']

        # arranjos a existentes
        df['DATA_COLHEITA'] = df['DATA_COLHEITA'].astype('datetime64[ns]')
        df['GRUPO'] = df['GRUPO'].astype('int64')

        df.astype({col: np.unicode_ for col in
                   COLS_STRING},
                  errors='raise').applymap(self.__normalize_result)
        # index = [COL_PACIENTE, COL_COLHEITA, 'NM_ANALISE', 'NM_PARAMETRO']

        # tentativa de resolver casos como o "     Gra IMAT     # / %"
        for c in COLS_STRING:
            df[c] = df[c].astype("string").str.strip().str.replace('\s+', ' ', regex=True)

        # df = df.drop(['DATA_VALIDACAO', 'ISOLAMENTO',
        #               'NM_MICRORGANISMO', 'NUM_BIOTIPO',
        #               'ANTIBIOTICO', 'NM_ANTIBIOTICO',
        #               'RESISTENCIA', 'NM_RESISTENCIA',
        #               'MIC'], axis=1)  # perdem-se estas colunas especificas ao resultado

        return df[[COL_COLHEITA, 'GRUPO', *COLS_STRING]].drop_duplicates()

    def __get_existing_parameters(self, conexao):
        params = None
        try:
            params = pd.read_sql(TBL_PARAMETRO, conexao, index_col=COL_PARAMETRO)
        except:
            self.__log_info("Parameters table doesn't exist in DB - Phase ignored")

        return params

    def __gerar_parametros(self, data):
        new_params = data[self.__CHAVE_PARAM] \
            .value_counts(dropna=False) \
            .reset_index()[self.__CHAVE_PARAM]  # drop ao contador
        # .sort_values(by=['NM_ANALISE', 'NM_PARAMETRO'], ascending=True)
        return new_params

    def __update_params(self, data, params=None):
        new_params = self.__gerar_parametros(data)
        num_new_params = 0

        if params is not None:
            new_params = pd.concat([params, new_params]).drop_duplicates(subset=self.__CHAVE_PARAM).reset_index(drop=True)
            num_new_params = new_params.size - params.size
            self.__log_info(f'{num_new_params} new params found')
        else:
            self.__log_info(f'Total params: {new_params.size}')

        new_params.index.name = COL_PARAMETRO
        return new_params, num_new_params

    def __map_params(self, patient_data, params):
        temp = params[self.__CHAVE_PARAM]

        for row in patient_data[self.__CHAVE_PARAM].fillna(value='').itertuples(name='Colheita'):
            val = (row.NM_ANALISE, row.NM_PARAMETRO, row.PRODUTO, row.VAL_REF, row.UNIDADES, row.GRUPO)
            corresp = (temp.fillna(value='') == val).all(axis='columns')  # comparar sem índice
            patient_data.at[row.Index, COL_PARAMETRO] = temp.index[corresp].astype(int).min()

        patient_data[COL_PARAMETRO] = patient_data[COL_PARAMETRO].astype(int)

        return patient_data

    def __resolve_conflicts(self, patient_data, params):
        # conflicts are results with the same param for the same sample (colheita)

        # initialize values with zeroes, case it doesn't exist
        if 'CONFLITOS' not in params.columns:
            params['CONFLITOS'] = np.zeros(params.index.size, dtype=int)

        dups = patient_data[patient_data.duplicated(subset=[COL_COLHEITA, COL_PARAMETRO], keep=False)] \
            .sort_values([COL_PARAMETRO, COL_COLHEITA])
        for k, v in dups.groupby([COL_COLHEITA, COL_PARAMETRO]).groups.items():
            data, param = k
            params.loc[param, 'CONFLITOS'] += len(v) - 1
            patient_results = patient_data.loc[v, 'RESULTADO']

            final = '+'.join(patient_results.dropna().astype("string").values)
            patient_data.loc[v[0], 'RESULTADO'] = str(final)
            patient_data.drop(v[1:].tolist(), inplace=True)

        return patient_data, params

    def __rotate_table(self, patient_data):
        df1 = patient_data[[COL_PACIENTE, COL_COLHEITA, 'SERVICO_REQ', 'RESULTADO', COL_PARAMETRO]]
        df2 = df1.pivot(columns=COL_PARAMETRO)['RESULTADO']
        res = pd.concat([df1.drop(['RESULTADO', COL_PARAMETRO], axis=1), df2], axis=1) \
            .groupby([COL_PACIENTE, COL_COLHEITA]).last()
        return res

    def __separate_main(self, patient_data):
        COLS_MAE = ['SERVICO_REQ', ]
        main = patient_data[COLS_MAE]
        children = patient_data.drop(COLS_MAE, axis=1)
        return main, children

    def __separate_params(self, size, table, complete_size, limit):
        first = size
        last = min(size + limit, complete_size)

        # lista de parametros presentes ate ao limite de cada tabela
        params = [int(col) for col in table.columns if str(col).isnumeric()]
        group = list(filter(lambda p: first <= p < last, params))
        return table[group]

    def __separate_tables(self, patient_data, limit=255):
        main, child_total = self.__separate_main(patient_data)

        limit = limit - len(patient_data.index.names)  # indice comum

        complete_size = int(patient_data.columns.tolist()[-1]) + 1
        if complete_size <= limit:
            return main, child_total
        else:
            limits = range(0, complete_size, limit)
            child = map(lambda n: self.__separate_params(n, child_total, complete_size, limit),
                        limits)
            return main, *child  # asterisco "desembrulha" a lista para o retorno ser 1D

    def __monitor_time(self, fun, designation="<lambda>"):
        tic = perf_counter()
        result = fun()
        toc = perf_counter()
        self.__log_info(f"{designation} took {toc - tic:0.4f} seconds")
        return result

    def __insert_params(self, engine, params):
        params.to_sql(TBL_PARAMETRO, con=engine, if_exists='replace', index=True, index_label=COL_PARAMETRO)

    def __insert_patient(self, engine, tables):
        # insert patient into table COLHEITA
        tables[0].to_sql(TBL_COLHEITA, con=engine, if_exists='append', index=True)
        # , index_label=[COL_PACIENTE, COL_COLHEITA])

        # insert patient results
        for n, df in enumerate(tables[1:]):
            nome = TBL_RESULTADO + str(n + 1)

            # will add the columns to existing RESULT tables
            # or create a new one if it doesn't exist yet
            try:
                existing_cols = pd.read_sql_query(f"SELECT * FROM {nome} LIMIT 1;", con=engine).columns.tolist()
                cols_to_add = map(str, df.columns.tolist())

                for col in set(cols_to_add) - set(existing_cols):
                    engine.execute('ALTER TABLE %s ADD `%s` TEXT' % (nome, col))
            except sqlalchemy.exc.ProgrammingError:
                self.__log_info(f"Table {nome} does not exist (no columns in common)")
            finally:
                df.reindex(sorted(df.columns), axis=1).to_sql(nome, con=engine, if_exists='append',
                                                              index=True)  # , index_label=[COL_PACIENTE, COL_COLHEITA])

    def run(self) -> int:
        self.__log_info('Starting execution...')
        # establish connection to DB

        with self.__engine.begin() as conn:
            # get existing params
            params = self.__get_existing_parameters(conn)

        # get the lab data files (only)
        filenames = self.__get_lab_data_files()
        num_files = len(filenames)
        self.__log_info(f'There are {num_files} files to processed.')

        num_new_params = 0

        for idx, filename in enumerate(filenames):
            self.__log_info(f'Processing file {idx + 1} of {num_files}...')

            patient_id = self.__get_patient_id(filename)
            file_bytes = self.__data.read(filename)

            patient_data = self.__monitor_time(lambda: self.__import_patient(file_bytes),
                                               f"Importing patient {patient_id}")

            if not patient_data.empty:
                params, num_params = self.__monitor_time(lambda: self.__update_params(patient_data, params),
                                             "Update params")

                patient_data = self.__monitor_time(lambda: self.__map_params(patient_data, params),
                                                   "Map params")

                patient_data, params = self.__monitor_time(
                    lambda: self.__resolve_conflicts(patient_data, params),
                    "Resolve conflicts")

                # add patient id column
                patient_data[COL_PACIENTE] = patient_id

                with self.__engine.begin() as conn:
                    # get patient from db
                    existing_patient = pd.read_sql_query(
                        f"SELECT `{COL_PACIENTE}`, `DATA_COLHEITA` "
                        f"FROM `{TBL_COLHEITA}` "
                        f"WHERE `{COL_PACIENTE}`={patient_id};",
                        con=conn)

                # if patient already exists, remove the duplicates between the two
                if not existing_patient.empty:
                    patient_data = remove_duplicate_rows(existing_patient, patient_data, ['ID_PACIENTE', 'DATA_COLHEITA'])

                # nothing to do if data is empty
                if patient_data.empty:
                    self.__log_info(f'No new rows for patient {patient_id}')
                    continue

                # rotate table
                pivot = self.__monitor_time(lambda: self.__rotate_table(patient_data),
                                            "Rotate patient data table")

                # separate tables
                COLS_MAE = ['SERVICO_REQ', ]  # nao resultados nem indice
                tables = self.__monitor_time(lambda: self.__separate_tables(pivot),
                                             "Separate tables")

                num_new_params = num_new_params + num_params

                # insert patient, results and params in DB
                with self.__engine.begin() as conn:
                    # insert patient and results
                    self.__monitor_time(lambda: self.__insert_patient(conn, tables),
                                        "Insert patient")

                    # replace all params
                    self.__monitor_time(lambda: self.__insert_params(conn, params),
                                        "Insert params")  # custa mas evita-se falhar no fim

        self.__log_info('Execution completed.')
        return num_new_params

    def __get_lab_data_files(self):

        def is_lab_data_file(f):
            return f.split('/')[0] == 'lab_data'

        return [f for f in self.__data.namelist() if is_lab_data_file(f)]
