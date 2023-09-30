from src.dto.DataModels import DataFetchReq


class StatsGraphsServInt:

    def get_boxplot_data(self, data_fetch_req: DataFetchReq):
        raise Exception('StatsGraphsServInt.get_boxplot_data: Not implemented.')

    def get_scatter_data(self, data_fetch_req: DataFetchReq):
        raise Exception('StatsGraphsServInt.get_scatter_data: Not implemented.')

    def get_nominal_data(self, data_fetch_req: DataFetchReq):
        raise Exception('StatsGraphsServInt.get_nominal_data: Not implemented.')
