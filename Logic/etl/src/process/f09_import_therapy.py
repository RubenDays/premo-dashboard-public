import pandas as pd
import sqlalchemy

from src.utils.MyLogger import MyLogger
from src.utils.connection import get_sqlalchemy_error
from src.utils.funcs import get_patient_id
from src.utils import global_vars


class ImportTherapy:

    def __init__(self, logger, engine, archive_data):
        self.__logger = MyLogger(logger=logger, prefix='09_import_therapy')
        self.__engine = engine
        self.__archive_data = archive_data

    def run(self):
        self.__logger.info('Starting execution...')

        filenames = self.__get_therapy_data_files()

        self.__logger.info('Retrieving data from DB...')
        with self.__engine.begin() as con:
            df_collections = pd.read_sql_query(
                sql=f'select ID_PACIENTE, DT_COLHEITA, DATA_ADMISSAO_UCI, DATA_ALTA_UCI from {global_vars.V_PATIENT_DATA_MIN_MAX_RESULT}',
                con=con)
            df_curr_long_therapy = self.__get_long_therapy_data(con)
            df_curr_cross_sec_therapy = self.__get_cross_sec_therapy_data(con)
            df_drugs = self.__get_drugs(con)

        if df_drugs.empty:
            drugs = {}
            next_drug_id = 0
        else:
            # get the existing drugs as dict
            next_drug_id = df_drugs['DRUG_ID'].max() + 1
            drugs = df_drugs.set_index('DRUG_NAME').to_dict()['DRUG_ID']

        # class to help with the "apply" when transforming DCI values to ids. Holds the state between iterations.
        lambda_helper = self.__LambdaHelper(next_id=next_drug_id, drugs=drugs)

        num_fn = len(filenames)
        patient_therapy_longitudinal_data = []
        patient_therapy_cross_sec_data = []
        for idx, filename in enumerate(filenames):
            self.__logger.info(f'Processing file {idx + 1} of {num_fn}...')

            patient_id = get_patient_id(filename)
            if not patient_id:
                self.__logger.info(f'{filename} with a bad name. Ignoring...')
                continue

            self.__logger.info(f'Reading file from patient {patient_id}...')

            # read file
            file_bytes = self.__archive_data.read(filename)
            df_patient_data = pd.read_excel(file_bytes)

            if len(df_patient_data.index) == 0:
                self.__logger.info(f'File is empty. Ignoring...')
                continue

            # converts the date columns to datetime
            self.__logger.info('Converting dates to datetime...')
            df_patient_data['INICIO'] = pd.to_datetime(df_patient_data['INICIO'])
            df_patient_data['FIM'] = pd.to_datetime(df_patient_data['FIM'])
            df_collections['DT_COLHEITA'] = pd.to_datetime(df_collections['DT_COLHEITA'])

            # selects the ID_PACIENTE row as series
            df_patient_collections = df_collections[df_collections[global_vars.COL_PACIENTE] == patient_id]
            if df_patient_collections.empty:
                self.__logger.warning(f'Patient does not exist in PATIENT_MIN_MAX_RESULT. Ignoring...')
                continue

            df_patient_longitudinal = self.__process_longitudinal_data(df_patient_collections, df_patient_data)
            df_patient_cross_sectional = self.__process_cross_sectional_data(df_patient_collections, df_patient_data)

            patient_therapy_longitudinal_data.append(df_patient_longitudinal)
            patient_therapy_cross_sec_data.append(df_patient_cross_sectional)

        # concatenate all patient dfs
        # reset the index and remove it
        self.__logger.info('Concatenating all DFs...')
        patient_therapy_longitudinal_data.append(df_curr_long_therapy)
        patient_therapy_cross_sec_data.append(df_curr_cross_sec_therapy)

        df_long_all = pd.concat(patient_therapy_longitudinal_data) \
            .drop_duplicates(subset=['ID_PACIENTE', 'DT_COLHEITA', 'DCI'], keep='first') \
            .reset_index(drop=True)

        df_cross_sec_all = pd.concat(patient_therapy_cross_sec_data) \
            .drop_duplicates(subset=['ID_PACIENTE', 'DCI'], keep='first') \
            .reset_index(drop=True)

        # self.__logger.info('Creating drugs DF...')
        # new_df_drugs = pd.DataFrame({
        #    'DRUG_ID': list(lambda_helper.drugs.values()),
        #    'DRUG_NAME': list(lambda_helper.drugs.keys())
        # })
        
        print(df_long_all)
        print(df_long_all.dtypes)
        rows = len(df_long_all.axes[0])
        cols = len(df_long_all.axes[1])

        self.__logger.info(f'Rows={rows}, Cols={cols}')

        # save to DB, replacing existing table
        with self.__engine.begin() as con:
            # self.__logger.info(f'Creating {global_vars.TBL_DRUGS} table...')
            # new_df_drugs.to_sql(name=global_vars.TBL_DRUGS, if_exists='replace', con=con, index=False,
            #                    dtype={'DRUG_ID': sqlalchemy.INT})

            self.__logger.info(f'Creating {global_vars.TBL_LONG_THERAPY} table...')
            df_long_all.to_sql(name=global_vars.TBL_LONG_THERAPY, if_exists='replace', con=con, index=False,
                               dtype={global_vars.COL_PACIENTE: sqlalchemy.INT})

            self.__logger.info(f'Creating {global_vars.TBL_CROSS_SEC_THERAPY} table...')
            df_cross_sec_all.to_sql(name=global_vars.TBL_CROSS_SEC_THERAPY, if_exists='replace', con=con, index=False,
                                    dtype={global_vars.COL_PACIENTE: sqlalchemy.INT})

        self.__logger.info('Execution ended.')

    def __process_longitudinal_data(self, df_patient_collections, df_patient_data):
        def process_row(df_collections, x):
            mask = (x['INICIO'] <= df_patient_collections['DT_COLHEITA']) \
                   & (x['FIM'] >= df_patient_collections['DT_COLHEITA'])

            dci_code = x['DCI']

            # create DF for when patient has the medication
            a = df_collections.loc[mask]
            a['DCI'] = dci_code
            a['VALUE'] = 1

            # create DF for when patient doesn't have the medication
            b = df_collections.loc[~mask]
            b['DCI'] = dci_code
            b['VALUE'] = 0

            # join both
            c = pd.concat([a, b])

            return c

        df_tmp = pd.concat(df_patient_data
                           .apply(lambda x: process_row(df_patient_collections, x), axis=1)
                           .tolist()) \
            .reset_index(drop=True)

        # groups the different drugs (usually there are several of the same drug)
        self.__logger.info('Grouping DCI...')
        df = pd.DataFrame(df_tmp.groupby(['ID_PACIENTE', 'DT_COLHEITA', 'DCI'])['VALUE'].any()).reset_index()

        return df

    def __process_cross_sectional_data(self, df_patient_collections, df_patient_data):
        df_patient_eps = df_patient_collections.iloc[0]

        def process_row(x):
            mask = (df_patient_eps['DATA_ADMISSAO_UCI'] <= x['INICIO'] <= df_patient_eps['DATA_ALTA_UCI']) \
                   | (df_patient_eps['DATA_ADMISSAO_UCI'] <= x['FIM'] <= df_patient_eps['DATA_ALTA_UCI']) \
                   | (x['INICIO'] <= df_patient_eps['DATA_ADMISSAO_UCI'] <= x['FIM'])

            dci_code = x['DCI']

            # create the new row
            a = pd.DataFrame({
                'ID_PACIENTE': [df_patient_eps['ID_PACIENTE']],
                'DCI': dci_code,
                'VALUE': mask
            })

            return a

        # Create a new DF with True and False for every DCI, depending on ICU start and end dates and drug
        # administration
        df_tmp = pd.concat(df_patient_data.apply(lambda x: process_row(x), axis=1).tolist()).reset_index(drop=True)

        # groups the different drugs (usually there are several of the same drug)
        self.__logger.info('Grouping VALUE...')
        df_grouped = pd.DataFrame(df_tmp.groupby(['ID_PACIENTE', 'DCI'])['VALUE'].any()).reset_index()

        return df_grouped

    def __get_drugs(self, con):
        try:
            return pd.read_sql_query(sql='select DRUG_ID, DRUG_NAME from DRUGS;', con=con)
        except sqlalchemy.exc.ProgrammingError as e:
            if get_sqlalchemy_error(e) == 1146:  # table does not exist
                con.execute(f'create table DRUGS (DRUG_ID int primary key, DRUG_NAME text);')
                return pd.DataFrame()
            raise e

    def __get_long_therapy_data(self, con):
        try:
            return pd.read_sql_query(sql=f'select * from {global_vars.TBL_LONG_THERAPY}', con=con)
        except sqlalchemy.exc.ProgrammingError as e:
            if get_sqlalchemy_error(e) == 1146:  # table does not exist
                return pd.DataFrame()
            raise e

    def __get_cross_sec_therapy_data(self, con):
        try:
            return pd.read_sql_query(sql=f'select * from {global_vars.TBL_CROSS_SEC_THERAPY}', con=con)
        except sqlalchemy.exc.ProgrammingError as e:
            if get_sqlalchemy_error(e) == 1146:  # table does not exist
                return pd.DataFrame()
            raise e

    def __get_therapy_data_files(self):

        def is_lab_data_file(f):
            return f.split('/')[0] == 'therapy_data'

        return [f for f in self.__archive_data.namelist() if is_lab_data_file(f)]

    class __LambdaHelper:

        def __init__(self, next_id: int, drugs: dict):
            self.next_id = next_id
            self.drugs = drugs

        def process_value(self, value):
            try:
                return f'f{self.drugs[value]}'
            except KeyError as e:
                self.drugs[value] = self.next_id
                self.next_id += 1
                return f'f{self.drugs[value]}'
