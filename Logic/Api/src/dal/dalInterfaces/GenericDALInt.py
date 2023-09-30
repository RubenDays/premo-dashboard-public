# A DAL for generic purposes, doesn't really have table/view representations
class GenericDALInt:

    # Gets the Demography to be shown in the UI.
    def get_demography(self):
        raise Exception('GenericDALInt.get_demography Not Implemented')

    # Gets the different waves.
    def get_vagas(self):
        raise Exception('GenericDALInt.get_vagas Not Implemented')

    def get_params(self):
        raise Exception('GenericDALInt.get_params Not Implemented')

    def get_daily_params(self):
        raise Exception('GenericDALInt.get_daily_params Not Implemented')