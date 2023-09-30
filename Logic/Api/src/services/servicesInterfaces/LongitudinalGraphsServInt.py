from src.dto.DataModels import DataKMFetchReq, DataLongFetchReq


class LongitudinalGraphsServInt:

    def get_longitudinal_separated_data(self, data_fetch_req: DataLongFetchReq):
        raise Exception('LongitudinalGraphsServInt.get_longitudinal_separated_data: Not implemented.')

    def get_longitudinal_aggr_data(self, data_fetch_req: DataLongFetchReq):
        raise Exception('LongitudinalGraphsServInt.get_longitudinal_aggr_data: Not implemented.')

    def get_km_data(self, data_fetch_req: DataKMFetchReq):
        raise Exception('LongitudinalGraphsServInt.get_km_data: Not implemented.')
