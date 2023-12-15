import yaml
import os


# global variables
with open("./configs/global_vars.yaml", "r", encoding='utf8') as f:
    YAML_CONFIG = yaml.load(f, Loader=yaml.FullLoader)

CONNECTION_STRING = os.getenv('PREMO_DB_CS')

# vars for mongodb access
MONGO_USER = os.getenv(key='MONGO_ROOT_USERNAME', default='root')
MONGO_PASSWORD = os.getenv(key='MONGO_ROOT_PASSWORD', default='example')
MONGO_URI = os.getenv(key='MONGO_URI', default='mongodb://localhost:27017')

# vars for mq access
MQ_HOST = os.getenv(key='MQ_HOST', default='localhost')
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
TBL_COLS = SCHEMA_CONFIG['tbl_cols']

V_FILTERED = SCHEMA_CONFIG['v_filtered']
TBL_TRANSFORMED_FILTERED_VALUES = SCHEMA_CONFIG['tbl_transformed_filtered_values']
TBL_MERGED_IDS_PARAMS = SCHEMA_CONFIG['tbl_merged_ids_params']
TBL_CAT_VALUES = SCHEMA_CONFIG['tbl_cat_values']
V_AGREG_CAT_VALUES = SCHEMA_CONFIG['v_agreg_cat_values']
V_AGREG_NUM_VALUES = SCHEMA_CONFIG['v_agreg_num_values']
V_PATIENT_DATA = SCHEMA_CONFIG['v_patient_data']
TBL_PATIENT_MIN_MAX_RESULT = SCHEMA_CONFIG['tbl_patient_min_max_result']
TBL_PATIENT_DATA_RESULT_NUM = SCHEMA_CONFIG['tbl_patient_data_result_num']
TBL_PATIENT_DATA_RESULT_CAT = SCHEMA_CONFIG['tbl_patient_data_result_cat']
V_PATIENT_DATA_MIN_MAX_RESULT = SCHEMA_CONFIG['v_patient_data_min_max_result']
V_PATIENT_DATA_MIN_MAX_RESULT_CAT = SCHEMA_CONFIG['v_patient_data_min_max_result_cat']
V_PARAMS_MERGED = SCHEMA_CONFIG['v_params_merged']
TBL_LONG_THERAPY = SCHEMA_CONFIG['tbl_long_therapy']
TBL_CROSS_SEC_THERAPY = SCHEMA_CONFIG['tbl_cross_sec_therapy']
TBL_DRUGS = SCHEMA_CONFIG['tbl_drugs']

TBL_EPISODIO = SCHEMA_CONFIG['tbl_episodio']
TBL_PROCESSO = SCHEMA_CONFIG['tbl_processo']
COL_EPISODIO = INPUT_CONFIG['col_episodio']

TBL_VMI = SCHEMA_CONFIG['tbl_vmi']
TBL_ECMO = SCHEMA_CONFIG['tbl_ecmo']
TBL_COMORB = SCHEMA_CONFIG['tbl_comorb']

TBL_LOGIN = SCHEMA_CONFIG['tbl_login']
