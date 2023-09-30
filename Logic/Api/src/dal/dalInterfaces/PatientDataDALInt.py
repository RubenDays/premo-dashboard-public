from src.dto.DataModels import DataExportDAL, DataFetchDAL, DataKMFetchDAL, DataLongFetchDAL


# Class that represents DAL for retrieving patient data.
class PatientDataDALInt:

    # Retrieve data for exporting
    def get_patient_data(self, data_export_req: DataExportDAL):
        raise Exception('PatientDataDALInt.get_patient_data Not Implemented')

    # Retrieve data for statistics (e.g. boxplots, scatter)
    def fetch_patient_data(self, data_fetch: DataFetchDAL):
        raise Exception('PatientDataDALInt.fetch_patient_data Not Implemented')

    # Retrieve data for longitudinal data (i.e. param evolution)
    def fetch_long_data(self, data_fetch: DataLongFetchDAL):
        raise Exception('PatientDataDALInt.fetch_long_data Not Implemented')

    # Retrieve data for survival curves
    def fetch_km_data(self, data_fetch: DataKMFetchDAL):
        raise Exception('PatientDataDALInt.fetch_km_data Not Implemented')

    def get_columns(self):
        raise Exception('PatientDataDALInt.get_columns Not Implemented')

    # Returns a dict with the columns that are enums. key are the columns names, and the value the table they represent.
    def get_enum_columns(self):
        raise Exception('PatientDataDALInt.get_enum_columns Not Implemented')

    # Gets the values of the enum 'tbl' and returns a tuple containing the labels and the ones to be displayed.
    def get_enum_values(self, tbl):
        raise Exception('PatientDataDALInt.get_enum_columns Not Implemented')

    # Retrieves data used for circular graphs.
    def fetch_patient_data_nominal(self, data_fetch: DataFetchDAL):
        raise Exception('PatientDataDALInt.fetch_patient_data_nominal Not Implemented')
