# Class that represents DAL for queries related to therapy.
from src.dto.DataModels import DataFetchTherapy


class TherapyDALInt:

    def get_therapy_data(self, data_fetch_therapy: DataFetchTherapy):
        raise Exception('ParamsDALIntT.get_therapy_data Not Implemented')
