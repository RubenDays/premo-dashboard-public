# libs not mine
import uvicorn
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware

from src.dal.dalSpecific.ColsDAL import ColsDAL
from src.dal.dalSpecific.TherapyDAL import TherapyDAL
# routers
from src.endpoints.AuthRouter import AuthRouter
from src.endpoints.ExportRouter import ExportRouter
from src.endpoints.ImportRouter import ImportRouter
from src.endpoints.LongitudinalGraphsRouter import LongitudinalGraphsRouter
from src.endpoints.ManagementRouter import ManagementRouter
from src.endpoints.SelectColsRouter import SelectColsRouter
from src.endpoints.StatsGraphsRouter import StatsGraphsRouter
from src.services.servicesSpecific.ImportServices import ImportServices

# services
from src.services.servicesSpecific.LongitudinalGraphsServices import LongitudinalGraphsServices
from src.services.servicesSpecific.ManagementServices import ManagementServices
from src.services.servicesSpecific.SelectColsServices import SelectColsServices
from src.services.servicesSpecific.StatsGraphsServices import StatsGraphsServices
from src.services.servicesSpecific.InitDataServices import InitDataServices
from src.services.servicesSpecific.DataExportServices import DataExportServices

# DALs
from src.dal.dalSpecific.UserDAL import UserDAL
from src.dal.dalSpecific.ParamsDAL import ParamsDAL
from src.dal.dalSpecific.GenericDAL import GenericDAL
from src.dal.dalSpecific.PatientDataDAL import PatientDataDAL

# others
from src.MyFastAPI import MyFastAPI
from src.utils.logger import get_app_logger, log_formater_str
from src.utils.connection import create_default_engine_helper

# logger instance
LOGGER = get_app_logger()

# engine instance for DB access
engine_helper = create_default_engine_helper()
engine_helper.test_connection()
engine = engine_helper.get_engine()

# create DAL instances
user_dal = UserDAL(engine)
params_dal = ParamsDAL(engine)
generic_dal = GenericDAL(engine)
therapy_dal = TherapyDAL(engine)
patient_data_dal = PatientDataDAL(engine)
cols_dal = ColsDAL(engine)

# create Services instances
init_data_services = InitDataServices(params_dal=params_dal, generic_dal=generic_dal, patient_data_dal=patient_data_dal, cols_dal=cols_dal)
stats_graphs_services = StatsGraphsServices(patient_data_dal=patient_data_dal, params_dal=params_dal, generic_dal=generic_dal)
export_data_services = DataExportServices(patient_data_dal=patient_data_dal, params_dal=params_dal, generic_dal=generic_dal, therapy_dal=therapy_dal)
longitudinal_graphs_services = LongitudinalGraphsServices(patient_data_dal=patient_data_dal, params_dal=params_dal, generic_dal=generic_dal)
management_services = ManagementServices(user_dal=user_dal)
cols_services = SelectColsServices(cols_dal=cols_dal)
import_services = ImportServices()

# create Routers
auth_router = AuthRouter(init_data_services)
stats_graphs_router = StatsGraphsRouter(stats_graphs_services)
export_router = ExportRouter(export_data_services)
longitudinal_router = LongitudinalGraphsRouter(longitudinal_graphs_services)
management_router = ManagementRouter(management_services=management_services)
import_router = ImportRouter(import_services)
cols_router = SelectColsRouter(select_cols_services=cols_services)

# create main Router
app = MyFastAPI()

# Do NOT use wildcard '*'. Will result in errors for the client because of Access-Control-Allow-Origin.
origins = [
    'http://localhost',
    'https://localhost',
    'http://localhost:3000',
    'https://localhost:3000'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE'],
    allow_headers=['*']
)

# add endpoints to the main router
app.include_router(export_router)
app.include_router(auth_router)
app.include_router(stats_graphs_router)
app.include_router(longitudinal_router)
app.include_router(management_router)
app.include_router(import_router)
app.include_router(cols_router)


@app.get('/')
def root(request: Request):
    LOGGER.info('root called')
    LOGGER.info('root called ended')
    return {
        'message': 'This is a message.'
    }


# ----------------------------------------------------------------------------------------------------------------------------------------

if __name__ == '__main__':
    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["access"]["fmt"] = log_formater_str
    log_config["formatters"]["default"]["fmt"] = log_formater_str

    uvicorn.run(app, host='0.0.0.0', port=8000, log_config=log_config)
