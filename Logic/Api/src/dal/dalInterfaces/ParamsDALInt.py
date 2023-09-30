# Class that represents DAL for queries related to params.
class ParamsDALInt:

    # get the existing daily params
    def get_daily_params(self):
        raise Exception('ParamsDALIntT.get_daily_params Not Implemented')

    # Retrieve the indicated merged params. If it's None then retrives all.
    def get_merged_params(self, param_ids=None):
        raise Exception('ParamsDALIntT.get_merged_params Not Implemented')

    # Gets the name of the indicated merged param.
    def get_merged_param_name(self, param: str):
        raise Exception('ParamsDALIntT.get_merged_param_name Not Implemented')
