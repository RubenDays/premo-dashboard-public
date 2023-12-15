import React, { useState } from "react";
import { Form, InputGroup, Button, OverlayTrigger, Tooltip, Row, Container } from "react-bootstrap";
import { useTranslation } from 'react-i18next'

import SelectCheckBox from "../../components/SelectCheckBox";
import { isCutoffInputValid, isPatientIDsInputValid, verifyDayUcisInput } from "../verifications";
import { COLS_ERR, PARAMS_ERR, PATIENT_IDS_ERR, DATE_BEGIN_ERR, DATE_END_ERR, DEMO_ERR, WAVES_ERR, COVID_ERR, CUTOFF_ERR, UCI_ERR, PARAM_CUTOFF_ERR, DAY_UCI_ERR, THERAPY_ERR, RATIO_PARAM_ERR } from "./formCodeErrors";
import { Option, OnChangeHandler, OnChangeRatio } from '../types'
import { addError, removeError } from "../funcs";


export const UCI_OPTS = {
    NAO_UCI: '0',
    UCI: '1',
    AMBOS: '2'
}

export const COVID_OPTS = {
    NAO_COVID: '0',
    COVID: '1',
    AMBOS: '2'
}

// used in case the verifications are handled in these components, such as string inputs (e.g. PatientIDs and Cutoffs)
// 'value' is string value, and the 'err' is the error code after verification
type CbAfterVerification = (value: string, err: number) => void


export function isColsErr(err: number) {
    return !!(err & COLS_ERR)
}

export function isCutoffParamErr(err: number) {
    return !!(err & PARAM_CUTOFF_ERR)
}

/**
 * Component for Params input form
 */
export type ParamsFormGroupProps = {
    err: number,
    onSelectParams: OnChangeHandler,
    maxSelected: number,
    values: Array<Option>,
    options: Array<Option>,
    onChangeResDaily?: OnChangeHandler,
    selectAll?: string
}
export function ParamsFormGroup({ err, maxSelected, values, options, onSelectParams, onChangeResDaily, selectAll }: ParamsFormGroupProps) {
    const { t } = useTranslation()

    function isParamsErr() {
        return !!(err & PARAMS_ERR)
    }

    return (
            /*Parâmetros form group*/
            <Form.Group className='mb-3'>
                <Form.Label>{t("form-fields.parameters.label")}</Form.Label>
                { onChangeResDaily ?
                    <Form.Check style={{fontSize: '15px'}} type='checkbox' id='cb-min-max-res' label={t("form-fields.parameters.daily-params-label")} onChange={onChangeResDaily} />
                    : <></>
                }
                <SelectCheckBox 
                    className={isParamsErr() || isColsErr(err) ? "error-box" : ""}
                    value={values}
                    maxSelected={maxSelected}
                    isMulti
                    onChangeHandler={onSelectParams}
                    options={options}
                    placeholder={t("form-fields.parameters.placeholder")}
                    selectAll={selectAll}
                />
                {isParamsErr() ? <Form.Label className='error-text'> {t("form-fields.parameters.error")} </Form.Label> : <></>}
            </Form.Group>
    )
}


/**
 * Component for Patient IDs input form
 */
export type PatientIDsFormGroupProps = {
    err: number,
    setPatientIds: CbAfterVerification
}
export function PatientIDsFormGroup({ err, setPatientIds }: PatientIDsFormGroupProps) {
    const [showHelp, setShowHelp] = useState<Boolean>(false)
    const { t } = useTranslation()

    function isPatientIdsErr() {
        return !!(err & PATIENT_IDS_ERR)
    }

    function onChangePatientIDs(ev: React.ChangeEvent<HTMLInputElement>) {
        let e = err
        if (isPatientIDsInputValid(ev.target.value)) {
            e = removeError(err, PATIENT_IDS_ERR)
        } else {
            e = addError(err, PATIENT_IDS_ERR)
        }

        setPatientIds(ev.target.value, e)
    }

    function toggleShowHelp() {
        setShowHelp(!showHelp)
    }

    return (
        /*Patient IDs form group*/
        <Form.Group className="mb-3">
            <Form.Label>{t("form-fields.patient-ids.label")}</Form.Label>
            <InputGroup>
                <Form.Control onChange={onChangePatientIDs} type="text" defaultValue={''} placeholder={t("form-fields.patient-ids.placeholder")} isInvalid={isPatientIdsErr()} isValid={!isPatientIdsErr()} />
                <Button onClick={toggleShowHelp} variant="outline-secondary">i</Button>
                <Form.Control.Feedback type='invalid'>{t("form-fields.patient-ids.error")}</Form.Control.Feedback>
                <Form.Control.Feedback type='valid' />
            </InputGroup>
            {showHelp ? 
                <Form.Text muted> {t("form-fields.patient-ids.help")} </Form.Text>
                : <></>
            }
        </Form.Group>
    )
}


/**
 * Component for Date begin and Date end input form
 */
export type DatesFormGroupProps = {
    err: number,
    dateBeginRef: React.MutableRefObject<HTMLInputElement>,
    dateEndRef: React.MutableRefObject<HTMLInputElement>
}
export function DatesFormGroup({ err, dateBeginRef, dateEndRef }: DatesFormGroupProps) {
    const { t } = useTranslation()

    function isDateBeginErr() {
        return !!(err & DATE_BEGIN_ERR)
    }

    function isDateEndErr() {
        return !!(err & DATE_END_ERR)
    }

    return (
        /*Date interval form group*/
        <Form.Group className="mb-3" controlId="dateInterval">
            <Form.Label> {t("form-fields.dates.label")} </Form.Label>
            <InputGroup className='z0' hasValidation>
                <InputGroup.Text> {t("form-fields.dates.date-begin")} </InputGroup.Text>                   
                <Form.Control type="date" ref={dateBeginRef} isInvalid={isDateBeginErr()} isValid={!isDateBeginErr()} />
                <Form.Control.Feedback type='invalid'> {t("form-fields.dates.date-begin-error")} </Form.Control.Feedback>
                <Form.Control.Feedback type='valid' />
            </InputGroup>
            <InputGroup className='z0'>
                <InputGroup.Text> {t("form-fields.dates.date-end")} </InputGroup.Text>
                <Form.Control type="date" ref={dateEndRef} isInvalid={isDateEndErr()} isValid={!isDateEndErr()}/>
                <Form.Control.Feedback type='invalid'> {t("form-fields.dates.date-end-error")} </Form.Control.Feedback>
                <Form.Control.Feedback type='valid' />
            </InputGroup>
        </Form.Group>
    )
}

export type DayUciFormGroupProps = {
    err: number,
    setDayUci: CbAfterVerification
} 
export function DayUciFormGroup({ err, setDayUci }: DayUciFormGroupProps) {
    const [showHelp, setShowHelp] = useState<Boolean>(false)
    const { t } = useTranslation()

     function isDayUciErr() {
        return !!(err & DAY_UCI_ERR)
    }

    function onChangeDayUci(ev: React.ChangeEvent<HTMLInputElement>) {
        let e = err
        if (verifyDayUcisInput(ev.target.value)) {
            e = err & (-1 - DAY_UCI_ERR)
        } else {
            e = err | DAY_UCI_ERR
        }

        setDayUci(ev.target.value, e)
    }

    function toggleShowHelp() {
        setShowHelp(!showHelp)
    }

    return (
        /*Dia UCI form group*/
        <Form.Group className="mb-3">
            <Form.Label> {t("form-fields.icu-day.label")} </Form.Label>
            <InputGroup >
                <Form.Control onChange={onChangeDayUci} type="text" defaultValue={''} placeholder={t("form-fields.icu-day.placeholder")} isInvalid={isDayUciErr()}  />
                <Button onClick={toggleShowHelp} variant="outline-secondary">i</Button>
                <Form.Control.Feedback type='invalid'> {t("form-fields.icu-day.error")} </Form.Control.Feedback>
            </InputGroup>
            {showHelp ? 
                <Form.Text muted> {t("form-fields.icu-day.help")} </Form.Text>
                : <></>
            }
        </Form.Group>
    )
}


/**
 * Component for Demography input form
 */
export type DemographyFormGroupProps = {
    err: number,
    values: Array<Option>,
    options: Array<Option>,
    onSelectDemography: OnChangeHandler,
    selectAll?: string
}
export function DemographyFormGroup({ err, values, onSelectDemography, options, selectAll }: DemographyFormGroupProps) {    
    const { t } = useTranslation()

    function isDemoErr() {
        return !!(err & DEMO_ERR)
    }

    return (
        /*Demografia form group*/
        <Form.Group className='mb-3'>
            <Form.Label> {t("form-fields.demography.label")} </Form.Label>
            <SelectCheckBox 
                className={isDemoErr() || isColsErr(err) ? "error-box" : ""}
                value={values}
                maxSelected={selectAll ? undefined : 1}
                isMulti
                onChangeHandler={onSelectDemography}
                options={options}
                placeholder={t("form-fields.demography.placeholder")}
                selectAll={selectAll}
            />
            {isDemoErr() ? <Form.Label className='error-text'> {t("form-fields.demography.error")} </Form.Label> : <></>}
        </Form.Group>
    )
}

/**
 * Component for Therapy input form
 */
 export type TherapyFormGroupProps = {
    err: number,
    values: Array<Option>,
    options: Array<Option>,
    onSelectTherapy: OnChangeHandler,
    selectAll?: string
}
export function TherapyFormGroup({ err, values, onSelectTherapy, options, selectAll }: TherapyFormGroupProps) {    
    const { t } = useTranslation()

    function isTherapyErr() {
        return !!(err & THERAPY_ERR)
    }

    return (
        /*Demografia form group*/
        <Form.Group className='mb-3'>
            <Form.Label> {t("form-fields.therapy.label")} </Form.Label>
            <SelectCheckBox 
                className={isTherapyErr() ? "error-box" : ""}
                value={values}
                maxSelected={selectAll ? undefined : 1}
                isMulti
                onChangeHandler={onSelectTherapy}
                options={options}
                placeholder={t("form-fields.therapy.placeholder")}
                selectAll={selectAll}
            />
            {isTherapyErr() ? <Form.Label className='error-text'> {t("form-fields.therapy.error")} </Form.Label> : <></>}
        </Form.Group>
    )
}



/**
 * Component for Wave input form
 */
export type WaveFormGroupProps = {
    err: number,
    values: Array<Option>,
    options: Array<Option>,
    onSelectWaves: OnChangeHandler
}
export function WaveFormGroup({ err, values, options, onSelectWaves }: WaveFormGroupProps) {
    const { t } = useTranslation()

    function isWavesErr() {
        return !!(err & WAVES_ERR)
    }

    return (
        /*Waves form group*/
        <Form.Group className="mb-3">
            <Form.Label> {t("form-fields.waves.label")} </Form.Label>
            <SelectCheckBox
                className={isWavesErr() ? "error-box" : ""}
                value={values}
                isMulti
                onChangeHandler={onSelectWaves}
                options={options}
                placeholder={t("form-fields.waves.placeholder")}
                selectAll={undefined}
                maxSelected={undefined}
            />
            {isWavesErr() ? <Form.Label className='error-text'> {t("form-fields.waves.error")} </Form.Label> : <></>}
        </Form.Group>
    )
}


/**
 * Component for Covid input form
 */
export type CovidFormGroupProps = {
    err: number,
    onChangeCovid: OnChangeHandler
}
export function CovidFormGroup({ err, onChangeCovid }: CovidFormGroupProps) {
    const { t } = useTranslation()

    function isCovidErr() {
        return !!(err & COVID_ERR)
    }

    return (
        /*Covid form group*/
        <Form.Group className={`mb-3 ${isCovidErr() ? "error-box" : ""}`} onChange={onChangeCovid}>
            <Form.Check style={{marginLeft: '0.5rem'}} inline label={t("form-fields.covid.covid")} name="grp-covid" type='radio' id='rb-covid-1' value={COVID_OPTS.COVID} />
            <Form.Check inline label={t("form-fields.covid.no-covid")} name="grp-covid" type='radio' id='rb-covid-2' value={COVID_OPTS.NAO_COVID} />
            <Form.Check inline label={t("form-fields.covid.both")} name="grp-covid" type='radio' id='rb-covid-3' defaultChecked value={COVID_OPTS.AMBOS} />
            {isCovidErr() ? <Form.Label className='error-text'> {t("form-fields.covid.error")} </Form.Label> : <></>}
        </Form.Group>
    )
}


/**
 * Component for Cutoff input form
 */
export type CutoffFormGroupProps = {
    err: number,
    setCutoff: CbAfterVerification,
    disabled: boolean
}
export function CutoffFormGroup({ err, setCutoff, disabled }: CutoffFormGroupProps) {
    const [showHelp, setShowHelp] = useState<boolean>(false)
    const { t } = useTranslation()

    function isCutoffErr() {
        return !!(err & CUTOFF_ERR)
    }

    function onChangeCutoff(ev: React.ChangeEvent<HTMLInputElement>) {
        let e = err
        if (isCutoffInputValid(ev.target.value)) {
            e = err & (-1 - CUTOFF_ERR)
        } else {
            e = err | CUTOFF_ERR
        }

        setCutoff(ev.target.value, e)
    }

    function toggleShowHelp() {
        setShowHelp(!showHelp)
    }

    return (
        <Form.Group className='mb3'>
            <Form.Label> {t("form-fields.cutoff.label")} </Form.Label>
            <InputGroup className='z0'>
                <Form.Control
                    disabled={disabled}
                    onChange={onChangeCutoff} 
                    type="text" 
                    defaultValue={''} 
                    placeholder={t("form-fields.cutoff.placeholder")}
                    isInvalid={isCutoffErr() || isCutoffParamErr(err)} 
                    isValid={!isCutoffErr() && !isCutoffParamErr(err)}
                />
                <Button onClick={toggleShowHelp} variant="outline-secondary">i</Button>
                <Form.Control.Feedback type='invalid'>
                    {isCutoffErr() 
                        ? t("form-fields.cutoff.errors.format") 
                        : t("form-fields.cutoff.errors.empty")
                    }
                </Form.Control.Feedback>
                <Form.Control.Feedback type='valid' />
                
                {showHelp ? 
                    <Form.Text muted> 
                        {t("form-fields.cutoff.help.line1")} <br />
                        {t("form-fields.cutoff.help.line2")}
                    </Form.Text>
                    : <></>
                }
            </InputGroup>
        </Form.Group>
    )
}


/**
 * Component for UCI input form
 */
export type UciFormGroupProps = {
    err: number,
    onChangeUCI: OnChangeHandler
}
export function UciFormGroup({ err, onChangeUCI }: UciFormGroupProps) {
    const { t } = useTranslation()

    function isUciErr() {
        return !!(err & UCI_ERR)
    }

    return (
        /*UCI form group*/
        <Form.Group className={`mb-3 ${isUciErr() ? "error-box" : ""}`} onChange={onChangeUCI}>
            <Form.Check style={{marginLeft: '0.5rem'}} inline label={t("form-fields.icu.icu")} name="grp-uci" type='radio' id='rb-uci-1' value={UCI_OPTS.UCI} />
            <Form.Check inline label={t("form-fields.icu.no-icu")} name="grp-uci" type='radio' id='rb-uci-2' value={UCI_OPTS.NAO_UCI} />
            <Form.Check inline label={t("form-fields.icu.both")} name="grp-uci" type='radio' id='rb-uci-3' defaultChecked value={UCI_OPTS.AMBOS} />
            {isUciErr() ? <Form.Label className='error-text'> {t("form-fields.icu.error")} </Form.Label> : <></>}
        </Form.Group>
    )
}

export type FormTitleGroupProps = {
    title: string,
    helpMsg: string | undefined
}
export function FormTitleGroup({ title, helpMsg }: FormTitleGroupProps) {
    const [showHelp, setShowHelp] = useState<boolean>(false)

    function toggleShowHelp() {
        setShowHelp(!showHelp)
    }

    return (
            <InputGroup>
                <h2 className='form-title'>
                    {title}
                    {helpMsg 
                        ? <Button 
                            onClick={toggleShowHelp}
                            className='rounded-circle centered-text-round-button'
                            variant="outline-secondary"
                          > ? </Button>
                        : <></>
                    }
                </h2>
                {showHelp 
                    ? <Form.Text muted> {helpMsg} </Form.Text>
                    : <></>
                }
            </InputGroup>
    )

}

export type FormRatioParamsProps = {
    err: number,
    selected: Array<Option>,
    options: Array<Option>,
    maxAllowed: number,
    onChangeRatioParams: OnChangeRatio
}
export function FormRatioParams({ err, selected, options, maxAllowed, onChangeRatioParams }: FormRatioParamsProps) {
    const { t } = useTranslation()

    function isRatioParamsErr() {
        return !!(err & RATIO_PARAM_ERR)
    }

    const a: any = []
    for (let idx = 0; idx <= maxAllowed; idx+=2) {
        a.push(<InputGroup key={`ratio-param-input-${idx}`}>
                    <SelectCheckBox
                        className={""}
                        value={selected[idx]}
                        isMulti
                        onChangeHandler={(ev: any) => onChangeRatioParams(ev, idx)}
                        options={options}
                        placeholder={''}
                        selectAll={undefined}
                        maxSelected={1}
                    />
                    <InputGroup.Text> {'/'} </InputGroup.Text>
                    <SelectCheckBox
                        className={""}
                        value={selected[idx+1]}
                        isMulti
                        onChangeHandler={(ev: any) => onChangeRatioParams(ev, idx+1)}
                        options={options}
                        placeholder={''}
                        selectAll={undefined}
                        maxSelected={1}
                    />
                </InputGroup>
            )
    }

    return (
        <Form.Group className="mb-3">
            <Form.Label> {'Rácio de parâmetros'} </Form.Label>
            { a }
            {isRatioParamsErr() ? <Form.Label className='error-text'> {t("form-fields.ratio-params.error")} </Form.Label> : <></>}
        </Form.Group>
    )
}
