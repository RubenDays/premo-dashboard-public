// Error codes for the forms
export const OK = 0
export const PATIENT_IDS_ERR = 1
export const DATE_BEGIN_ERR = 2
export const DATE_END_ERR = 4
export const WAVES_ERR = 8
export const COVID_ERR = 16
export const UCI_ERR = 32
export const DEMO_ERR = 64
export const PARAMS_ERR = 128
export const COLS_ERR = 256 // combination of demography and params are verified by the components that use the forms
export const CUTOFF_ERR = 512
export const PARAM_CUTOFF_ERR = 1024 // in case there's no cutoff in the presence of a param
export const DAY_UCI_ERR = 2048

export const ERROR_FIELDS = {
    'patient_ids': PATIENT_IDS_ERR,
    'begin_date': DATE_BEGIN_ERR,
    'end_date': DATE_END_ERR,
    'vagas': WAVES_ERR,
    'covid': COVID_ERR,
    'uci': UCI_ERR,
    'cutoff': CUTOFF_ERR,
    'param': PARAMS_ERR,
    'demography': DEMO_ERR,
    'day_uci': DAY_UCI_ERR
}
