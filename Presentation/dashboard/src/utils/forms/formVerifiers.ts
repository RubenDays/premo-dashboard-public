import { isCutoffInputValid, isInt, isPatientIDsInputValid, isValidDate, isValidDayUci } from "../verifications"
import { COVID_ERR, CUTOFF_ERR, DATE_BEGIN_ERR, DATE_END_ERR, DAY_UCI_ERR, DEMO_ERR, ERROR_FIELDS, PARAMS_ERR, PATIENT_IDS_ERR, UCI_ERR, WAVES_ERR } from "./formCodeErrors"
import { Option } from '../types'

export enum FormField {
    PATIENT_IDS,
    DATES,
    UCI,
    COVID,
    WAVES,
    DEMOGRAPHY,
    PARAMS,
    CUTOFFS,
    DAY_UCI,
    RES_DAILY,
    SEPARATE_PACIENTS,
}

type PatientIDsInput = undefined | string
type DatesInput = {
    dateBegin: undefined | string,
    dateEnd: undefined | string
}
type DayUciInput = undefined | string
type UciInput = string
type CovidInput = string
type WavesInput = Array<Option>
type DemographyInput = {
    demo: Array<Option>,
    validOptions: Array<Option>
}
type ResDailyInput = boolean
type ParamsInput = {
    params: Array<Option>,
    validOptions: Array<Option>
}
type CutoffsInput = undefined | string
type SeparatePacientsInput = boolean

const formFieldVerifiers = {
    [FormField.PATIENT_IDS]: (formValues: { patientIDs: PatientIDsInput; }) => verifyPatientIDS(formValues.patientIDs),
    [FormField.DATES]: (formValues: { dates: DatesInput; }) => verifyDates(formValues.dates),
    [FormField.UCI]: (formValues: { uci: UciInput; }) => verifyUci(formValues.uci),
    [FormField.COVID]: (formValues: { covid: CovidInput; }) => verifyCovid(formValues.covid),
    [FormField.WAVES]: (formValues: { waves: WavesInput; }) => verifyWaves(formValues.waves),
    [FormField.DEMOGRAPHY]: (formValues: { demography: DemographyInput; }) => verifyDemography(formValues.demography),
    [FormField.PARAMS]: (formValues: { parameters: ParamsInput; }) => verifyParams(formValues.parameters),
    [FormField.CUTOFFS]: (formValues: { cutoffs: CutoffsInput; }) => verifyCutoffs(formValues.cutoffs),
    [FormField.DAY_UCI]: (formValues: { dayUci: DayUciInput; }) => verifyDayUci(formValues.dayUci),
    [FormField.RES_DAILY]: (formValues: { resDaily: ResDailyInput; }) => verifyResDaily(formValues.resDaily),
    [FormField.SEPARATE_PACIENTS]: (formValues: { separatePatients: SeparatePacientsInput; }) => verifySeparatePacients(formValues.separatePatients),
}

export function VerifyForms(fields: Array<FormField>, formState: any) {
    let partialRes = {
        err: 0,
        queryStrParts: Array<string>()
    }

    fields.forEach(field => {
        const res = formFieldVerifiers[field](formState)
        partialRes.err += res.err
        partialRes.queryStrParts.push(...res.queryStrPart)
    })

    const cleanQSParts = partialRes.queryStrParts.filter(e => e)
    return {
        err: partialRes.err,
        queryStr: `?${cleanQSParts.join('&')}`
    }
}

function verifyPatientIDS(patientIDs: PatientIDsInput) {
    let err = 0
    let queryStrPart = ''
    // verification for patient IDs input
    if (patientIDs) {
        // if patientIDs input is not valid, mark with error
        if (!isPatientIDsInputValid(patientIDs)) {
            err = PATIENT_IDS_ERR
        } else {
            // else construct the query string
            queryStrPart = `patient_ids=${patientIDs.trim()}`
        }
    }

    return {
        err: err,
        queryStrPart: [queryStrPart]
    }
}

function verifyDayUci(dayUci: DayUciInput) {
    let err = 0
    let queryStrPart = ''
    // verification for patient IDs input
    if (dayUci) {
        // if patientIDs input is not valid, mark with error
        if (!isValidDayUci(dayUci)) {
            err = DAY_UCI_ERR
        } else {
            // else construct the query string
            queryStrPart = `day_uci=${dayUci}`
        }
    }

    return {
        err: err,
        queryStrPart: [queryStrPart]
    }
}

function verifyDates(dates: DatesInput) {
    let err = 0
    let queryParts = []
    console.log(dates)

    // final verification of date begin input
    if (dates.dateBegin) {
        if (!isValidDate(dates.dateBegin)) {
            // date begin error
            err += DATE_BEGIN_ERR
        }
        queryParts.push(`begin_date=${dates.dateBegin}`)
    }

    // final verification of date end input
    if (dates.dateEnd) {
        if (!isValidDate(dates.dateEnd)) {
            // date end error
            err += DATE_END_ERR
        }
        queryParts.push(`end_date=${dates.dateEnd}`)
    }

    // if both dates are valid, check if "begin" is before "end"
    // if both dates didn't result in error
    if (err < DATE_BEGIN_ERR) {
        // if both have values
        if (dates.dateBegin && dates.dateEnd) {
            const dateBegin = Date.parse(dates.dateBegin)
            const dateEnd = Date.parse(dates.dateEnd)
            // if "date begin" is bigger than "date end"
            if (dateBegin > dateEnd) {
                // error from both dates (4+2)
                err +=  (DATE_BEGIN_ERR + DATE_END_ERR)
            }
        }
    }

    return {
        err: err,
        queryStrPart: queryParts
    }
}

function verifyUci(uci: UciInput) {
    let err = 0
    let queryPart = ''

    // verification for UCI
    if (isInt(uci)) {
        const u = parseInt(uci)
        if (u >= 0 && u <= 2) {
            queryPart = `uci=${u}`
        } else {
            err += UCI_ERR
        }
    } else {
        err += UCI_ERR
    }
    
    return {
        err: err,
        queryStrPart: [queryPart]
    }
}

function verifyCovid(covid: CovidInput) {
    let err = 0
    let queryPart = ''

    // verification for Covid
    if (isInt(covid)) {
        const c = parseInt(covid)
        if (c >= 0 && c <= 2) {
            queryPart = `covid=${c}`
        } else {
            err += COVID_ERR
        }
    } else {
        err += COVID_ERR
    }

    return {
        err: err,
        queryStrPart: [queryPart]
    }
}

function verifyWaves(waves: WavesInput) {
    let err = 0
    let queryPart = ''

    // verification for waves
    if (waves.length > 0) {
        if (waves.every(e => isInt(e.value))) {
            queryPart = `vagas=${waves.map(e => e.value).join(',')}`
        } else {
            err += WAVES_ERR
        }
    }

    return {
        err: err,
        queryStrPart: [queryPart]
    }
}

function verifyDemography(demography: DemographyInput) {
    let err = 0
    let queryPart = ''

    // final verification for Demography
    if (demography.demo.length > 0) {
        if (demography.demo.every(e => demography.validOptions.includes(e))) {
            queryPart = `demography=${demography.demo.map(e => e.value).join(',')}`
        } else {
            err += DEMO_ERR
        }
    }

    return {
        err: err,
        queryStrPart: [queryPart]
    }
}

function verifyParams(parameters: ParamsInput) {
    let err = 0
    let queryPart = ''

    // final verification for Params
    if (parameters.params.length > 0) {
        if (parameters.params.every(elem => parameters.validOptions.includes(elem))) {
            queryPart = `params=${parameters.params.map(e => e.value).join(',')}`
        } else {
            err += PARAMS_ERR
        }
    }

    return {
        err: err,
        queryStrPart: [queryPart]
    }
}

function verifyCutoffs(cutoffs: CutoffsInput) {
    let err = 0
    let queryPart = ''

    if (cutoffs) {
        if (isCutoffInputValid(cutoffs)) {
            queryPart = `cutoffs=${cutoffs.trim()}`
        } else {
            err = CUTOFF_ERR
        }
    }

    return {
        err: err,
        queryStrPart: [queryPart]
    }
}

function verifyResDaily(resDaily: ResDailyInput) {
    return {
        err: 0,
        queryStrPart: [`res_daily=${resDaily}`]
    }
}

function verifySeparatePacients(separatePacients: SeparatePacientsInput) {
    return {
        err: 0,
        queryStrPart: [`separate_patients=${separatePacients}`]
    }
}

export function getErrorCode(fields: Array<string>) {
    return getGeneralErrorCode(fields, ERROR_FIELDS)
}

export function getGeneralErrorCode(fieldsToVerify: Array<string>, errorCodes: any) {
    let err = 0
    fieldsToVerify.forEach(field => {
        if (errorCodes.hasOwnProperty(field)) {
            type ObjectKey = keyof typeof errorCodes
            err += errorCodes[field as ObjectKey]
        }
    })

    return err
}