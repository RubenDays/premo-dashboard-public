import { BASE_PATH } from "./basepath"

// Contains path constants for calling API to be used in the application.
const AUTH_PATH = BASE_PATH + '/auth'
export const LOGIN_PATH = AUTH_PATH + '/token'
export const REFRESH_PATH = AUTH_PATH + '/refresh-token'
export const LOGOUT_PATH = AUTH_PATH + '/logout'
export const VERIFY_AUTH_PATH = AUTH_PATH + '/verify'

export const EXPORT_PATH = BASE_PATH + '/export'
export const IMPORT_PATH = BASE_PATH + '/import'

const STATS_GRAPHS = BASE_PATH + '/stats-graphs'
export const NOMINAL_VALS_PATH = STATS_GRAPHS + '/nominal'
export const BOXPLOT_PATH = STATS_GRAPHS + '/quant-nominal'
export const QUANT_VALS_PATH = STATS_GRAPHS + '/quant'

const LONGITUDINAL_GRAPHS = BASE_PATH + '/longitudinal-graphs'
export const LONG_AGGR_PATH = LONGITUDINAL_GRAPHS + '/long-aggr'
export const LONG_SEPARATED_PATH = LONGITUDINAL_GRAPHS + '/long-separated'
export const KM_PATH = LONGITUDINAL_GRAPHS + '/km'

const MANAGEMENT = BASE_PATH + '/management'
export const MANAGEMENT_USERS_PATH = MANAGEMENT + '/user' 
