from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from src.dto.DataModels import DataExportReq
from src.dto.UserModels import User
from src.services.SecurityServices import get_current_active_user
from src.services.servicesInterfaces.DataExportServInt import DataExportServInt


class ExportRouter(APIRouter):

    def __init__(self, export_data_services: DataExportServInt):
        self.__export_data_services = export_data_services

        super().__init__(prefix='/export', tags=['export'])
        # Can't define endpoints through annotations, because fastapi will assume that 'self' is a query parameter and
        # will try to parse it. As such, it is required to manually set the endpoints, because it is desired to have
        # these routers inside classes as a way to inject services dependencies.
        super().add_api_route(path='', endpoint=self.export_patient_data, methods=['GET'])

    # @router.get('')
    def export_patient_data(self, user: User = Depends(get_current_active_user), query_params: DataExportReq = Depends()):
        excel_bytes: bytes = self.__export_data_services.export_patient_data_results(query_params)

        return StreamingResponse(
            iter(excel_bytes),
            media_type='application/x-zip-compressed',
            headers={'Content-Disposition': f'attachment;filename={"export_patients.zip"}'}
        )
