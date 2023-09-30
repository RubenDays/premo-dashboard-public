from fastapi import APIRouter, Depends

from src.dto.DataModels import DataFetchReq
from src.dto.UserModels import User
from src.services.SecurityServices import get_current_active_user
from src.services.servicesInterfaces.StatsGraphsServInt import StatsGraphsServInt


class StatsGraphsRouter(APIRouter):

    def __init__(self, stats_graphs_services: StatsGraphsServInt):
        self.__stats_graphs_services = stats_graphs_services

        super().__init__(prefix='/stats-graphs', tags=['stats-graphs'])
        # Can't define endpoints through annotations, because fastapi will assume that 'self' is a query parameter and
        # will try to parse it. As such, it is required to manually set the endpoints, because it is desired to have
        # these routers inside classes as a way to inject services dependencies.
        
        super().add_api_route(path='/quant', endpoint=self.fetch_patient_data_quant, methods=['GET'])
        super().add_api_route(path='/quant-nominal', endpoint=self.fetch_boxplot_data, methods=['GET'])
        super().add_api_route(path='/nominal', endpoint=self.fetch_patient_data_nominal, methods=['GET'])

    def fetch_boxplot_data(self, user: User = Depends(get_current_active_user), query_params: DataFetchReq = Depends()):
        data = self.__stats_graphs_services.get_boxplot_data(query_params)

        return data

    def fetch_patient_data_quant(self, user: User = Depends(get_current_active_user), query_params: DataFetchReq = Depends()):
        result = self.__stats_graphs_services.get_scatter_data(query_params)

        return result

    def fetch_patient_data_nominal(self, user: User = Depends(get_current_active_user), query_params: DataFetchReq = Depends()):
        result = self.__stats_graphs_services.get_nominal_data(query_params)

        return result
