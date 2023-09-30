import os
import yaml


# Global variables
with open("./configs/global_vars.yaml", "r", encoding='utf8') as f:
    YAML_CONFIG = yaml.load(f, Loader=yaml.FullLoader)

CONNECTION_STRING = os.getenv('PREMO_DB_CS')
MONGO_USER = os.getenv('MONGO_ROOT_USERNAME')
MONGO_PASSWORD = os.getenv('MONGO_ROOT_PASSWORD')
MONGO_URI = os.getenv('MONGO_URI')

# vars for mq access
MQ_HOST = os.getenv(key='MQ_HOST', default='rabbitmq')
MQ_PORT = os.getenv(key='MQ_PORT', default='5672')
MQ_QUEUE = os.getenv(key='MQ_QUEUE', default='premo-files-queue')
MQ_EXCHANGE = os.getenv(key='MQ_EXCHANGE', default='premo-files')
MQ_ROUTING_KEY = os.getenv(key='MQ_ROUTING_KEY', default='premo-file-upl')

INPUT_CONFIG = YAML_CONFIG['input']
COL_PACIENTE = INPUT_CONFIG['col_paciente']
COL_COLHEITA = INPUT_CONFIG['col_colheita']
COL_PARAMETRO = INPUT_CONFIG['col_parametro']

CONFIGS_BASE = INPUT_CONFIG['configs_base']
LOGS_BASE = INPUT_CONFIG['logs_base']

SCHEMA_CONFIG = YAML_CONFIG['schema']
TBL_COLHEITA = SCHEMA_CONFIG['tbl_colheita']
TBL_RESULTADO = SCHEMA_CONFIG['tbl_resultado']
TBL_PARAMETRO = SCHEMA_CONFIG['tbl_parametro']

V_FILTERED = SCHEMA_CONFIG['v_filtered']
TBL_TRANSFORMED_FILTERED_VALUES = SCHEMA_CONFIG['tbl_transformed_filtered_values']
TBL_MERGED_IDS_PARAMS = SCHEMA_CONFIG['tbl_merged_ids_params']
TBL_CAT_VALUES = SCHEMA_CONFIG['tbl_cat_values']
V_AGREG_CAT_VALUES = SCHEMA_CONFIG['v_agreg_cat_values']
V_AGREG_NUM_VALUES = SCHEMA_CONFIG['v_agreg_num_values']
V_PATIENT_DATA = SCHEMA_CONFIG['v_patient_data']
V_PATIENT_DATA_RESULT_CAT = SCHEMA_CONFIG['v_patient_data_result_cat']
V_PATIENT_DATA_RESULT_NUM = SCHEMA_CONFIG['v_patient_data_result_num']
# V_PATIENT_MIN_MAX_RESULT = SCHEMA_CONFIG['v_patient_min_max_result']
TBL_PATIENT_MIN_MAX_RESULT = SCHEMA_CONFIG['tbl_patient_min_max_result']
V_PATIENT_DATA_MIN_MAX_RESULT = SCHEMA_CONFIG['v_patient_data_min_max_result']
V_PATIENT_DATA_MIN_MAX_RESULT_CAT = SCHEMA_CONFIG['v_patient_data_min_max_result_cat']
V_PARAMS_MERGED = SCHEMA_CONFIG['v_params_merged']

TBL_EPISODIO = SCHEMA_CONFIG['tbl_episodio']
TBL_PROCESSO = SCHEMA_CONFIG['tbl_processo']
COL_EPISODIO = INPUT_CONFIG['col_episodio']

TBL_LOGIN = SCHEMA_CONFIG['tbl_login']