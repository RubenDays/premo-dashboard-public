from fastapi import APIRouter, Depends

from src.dto.DataModels import DataFetchReq, DataKMFetchReq, DataLongFetchReq
from src.dto.UserModels import User
from src.services.SecurityServices import get_current_active_user
from src.services.servicesInterfaces.LongitudinalGraphsServInt import LongitudinalGraphsServInt


class LongitudinalGraphsRouter(APIRouter):

    def __init__(self, long_graphs_services: LongitudinalGraphsServInt):
        self.__long_graphs_services = long_graphs_services

        super().__init__(prefix='/longitudinal-graphs', tags=['long-graphs'])
        # Can't define endpoints through annotations, because fastapi will assume that 'self' is a query parameter and
        # will try to parse it. As such, it is required to manually set the endpoints, because it is desired to have
        # these routers inside classes as a way to inject services dependencies.
        super().add_api_route(path='/long-aggr', endpoint=self.fetch_longitudinal_data_aggr, methods=['GET'])
        super().add_api_route(path='/long-separated', endpoint=self.fetch_longitudinal_data_separated, methods=['GET'])
        super().add_api_route(path='/km', endpoint=self.fetch_km_data, methods=['GET'])

    def fetch_longitudinal_data_aggr(self, user: User = Depends(get_current_active_user), query_params: DataLongFetchReq = Depends()):
        result = self.__long_graphs_services.get_longitudinal_aggr_data(query_params)

        return result

    def fetch_longitudinal_data_separated(self, user: User = Depends(get_current_active_user), query_params: DataLongFetchReq = Depends()):
        result = self.__long_graphs_services.get_longitudinal_separated_data(query_params)

        return result

    def fetch_km_data(self, user: User = Depends(get_current_active_user), query_params: DataKMFetchReq = Depends()):
        result = self.__long_graphs_services.get_km_data(query_params)

        return result

