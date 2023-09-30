import { useState } from "react";
import { Form, InputGroup, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import SelectCheckBox from "../../components/SelectCheckBox";
import { isCutoffInputValid, isPatientIDsInputValid, isValidDayUci } from "../verifications";
import { COLS_ERR, PARAMS_ERR, PATIENT_IDS_ERR, DATE_BEGIN_ERR, DATE_END_ERR, DEMO_ERR, WAVES_ERR, COVID_ERR, CUTOFF_ERR, UCI_ERR, PARAM_CUTOFF_ERR, DAY_UCI_ERR } from "./formCodeErrors";
import { Option, OnChangeHandler } from '../types'
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
}
export function ParamsFormGroup({ err, maxSelected, values, options, onSelectParams, onChangeResDaily }: ParamsFormGroupProps) {

    function isParamsErr() {
        return !!(err & PARAMS_ERR)
    }

    return (
            /*Parâmetros form group*/
            <Form.Group className='mb-3'>
                <Form.Label>Parâmetros</Form.Label>
                { onChangeResDaily ?
                    <Form.Check style={{fontSize: '15px'}} type='checkbox' id='cb-min-max-res' label='Resultados Únicos Diários (apenas UCI)' onChange={onChangeResDaily} />
                    : <></>
                }
                <SelectCheckBox 
                    className={isParamsErr() || isColsErr(err) ? "error-box" : ""}
                    value={values}
                    maxSelected={maxSelected}
                    isMulti
                    onChangeHandler={onSelectParams}
                    options={options}
                    placeholder={'Nenhum selecionado'}
                    selectAll={undefined}
                />
                {isParamsErr() ? <Form.Label className='error-text'> Valores de parâmetro inválidos </Form.Label> : <></>}
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
            <Form.Label>IDs dos pacientes</Form.Label>
            <InputGroup>
                <Form.Control onChange={onChangePatientIDs} type="text" defaultValue={''} placeholder="Inserir IDs" isInvalid={isPatientIdsErr()} isValid={!isPatientIdsErr()} />
                <Button onClick={toggleShowHelp} variant="outline-secondary">i</Button>
                <Form.Control.Feedback type='invalid'>IDs inválidos</Form.Control.Feedback>
                <Form.Control.Feedback type='valid' />
            </InputGroup>
            {showHelp ? 
                <Form.Text muted> e.g. selecionar pacientes 10 e 15 a 20: 10;15-20</Form.Text>
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

    function isDateBeginErr() {
        return !!(err & DATE_BEGIN_ERR)
    }

    function isDateEndErr() {
        return !!(err & DATE_END_ERR)
    }

    return (
        /*Date interval form group*/
        <Form.Group className="mb-3" controlId="dateInterval">
            <Form.Label>Intervalo de datas</Form.Label>
            <InputGroup className='z0' hasValidation>
                <InputGroup.Text>Data início</InputGroup.Text>                   
                <Form.Control type="date" ref={dateBeginRef} isInvalid={isDateBeginErr()} isValid={!isDateBeginErr()} />
                <Form.Control.Feedback type='invalid'>Data de início inválida</Form.Control.Feedback>
                <Form.Control.Feedback type='valid' />
            </InputGroup>
            <InputGroup className='z0'>
                <InputGroup.Text>Data Fim</InputGroup.Text>
                <Form.Control type="date" ref={dateEndRef} isInvalid={isDateEndErr()} isValid={!isDateEndErr()}/>
                <Form.Control.Feedback type='invalid'>Data de fim inválida</Form.Control.Feedback>
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

     function isDayUciErr() {
        return !!(err & DAY_UCI_ERR)
    }

    function onChangeDayUci(ev: React.ChangeEvent<HTMLInputElement>) {
        let e = err
        if (isValidDayUci(ev.target.value)) {
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
            <Form.Label>Dia de internamento na UCI</Form.Label>
            <InputGroup >
                <Form.Control onChange={onChangeDayUci} type="text" defaultValue={''} placeholder="Nenhum selecionado" isInvalid={isDayUciErr()}  />
                <Button onClick={toggleShowHelp} variant="outline-secondary">i</Button>
                <Form.Control.Feedback type='invalid'>Dia inválido</Form.Control.Feedback>
            </InputGroup>
            {showHelp ? 
                <Form.Text muted> Número inteiro positivo maior do que 0. </Form.Text>
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
    onSelectDemography: OnChangeHandler
}
export function DemographyFormGroup({ err, values, onSelectDemography, options }: DemographyFormGroupProps) {    
    
    function isDemoErr() {
        return !!(err & DEMO_ERR)
    }

    return (
        /*Demografia form group*/
        <Form.Group className='mb-3'>
            <Form.Label>Demografia</Form.Label>
            <SelectCheckBox 
                className={isDemoErr() || isColsErr(err) ? "error-box" : ""}
                value={values}
                maxSelected={1}
                isMulti
                onChangeHandler={onSelectDemography}
                options={options}
                placeholder={'Nenhuma selecionada'}
                selectAll={undefined}
            />
            {isDemoErr() ? <Form.Label className='error-text'> Valores de demografia inválidos </Form.Label> : <></>}
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

    function isWavesErr() {
        return !!(err & WAVES_ERR)
    }

    return (
        /*Waves form group*/
        <Form.Group className="mb-3">
            <Form.Label>Vagas</Form.Label>
            <SelectCheckBox
                className={isWavesErr() ? "error-box" : ""}
                value={values}
                isMulti
                onChangeHandler={onSelectWaves}
                options={options}
                placeholder={'Nenhuma selecionada'}
                selectAll={undefined}
                maxSelected={undefined}
            />
            {isWavesErr() ? <Form.Label className='error-text'>Vagas inválidas</Form.Label> : <></>}
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

    function isCovidErr() {
        return !!(err & COVID_ERR)
    }

    return (
        /*Covid form group*/
        <Form.Group className={`mb-3 ${isCovidErr() ? "error-box" : ""}`} onChange={onChangeCovid}>
            <Form.Check style={{marginLeft: '0.5rem'}} inline label="Covid" name="grp-covid" type='radio' id='rb-covid-1' value={COVID_OPTS.COVID} />
            <Form.Check inline label="Não Covid" name="grp-covid" type='radio' id='rb-covid-2' value={COVID_OPTS.NAO_COVID} />
            <Form.Check inline label="Ambos" name="grp-covid" type='radio' id='rb-covid-3' defaultChecked value={COVID_OPTS.AMBOS} />
            {isCovidErr() ? <Form.Label className='error-text'> Valor de Covid inválido. </Form.Label> : <></>}
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
            <Form.Label><i>Cutoff</i></Form.Label>
            <InputGroup className='z0'>
                <Form.Control
                    disabled={disabled}
                    onChange={onChangeCutoff} 
                    type="text" 
                    defaultValue={''} 
                    placeholder="Inserir Cutoffs" 
                    isInvalid={isCutoffErr() || isCutoffParamErr(err)} 
                    isValid={!isCutoffErr() && !isCutoffParamErr(err)}
                />
                <Button onClick={toggleShowHelp} variant="outline-secondary">i</Button>
                <Form.Control.Feedback type='invalid'>
                    {isCutoffErr() ? 'Formatação inválida' : 'É necessário cutoff na presença de parâmetro.'}
                </Form.Control.Feedback>
                <Form.Control.Feedback type='valid' />
                
                {showHelp ? 
                    <Form.Text muted> 
                        Apenas válido na presença parâmetros. <br /> 
                        e.g. selecionar cutoff &lt;10 e entre 15 e 20: &lt;10;15-20</Form.Text>
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

    function isUciErr() {
        return !!(err & UCI_ERR)
    }

    return (
        /*UCI form group*/
        <Form.Group className={`mb-3 ${isUciErr() ? "error-box" : ""}`} onChange={onChangeUCI}>
            <Form.Check style={{marginLeft: '0.5rem'}} inline label="UCI" name="grp-uci" type='radio' id='rb-uci-1' value={UCI_OPTS.UCI} />
            <Form.Check inline label="Não UCI" name="grp-uci" type='radio' id='rb-uci-2' value={UCI_OPTS.NAO_UCI} />
            <Form.Check inline label="Ambos" name="grp-uci" type='radio' id='rb-uci-3' defaultChecked value={UCI_OPTS.AMBOS} />
            {isUciErr() ? <Form.Label className='error-text'> Valor de UCI inválido. </Form.Label> : <></>}
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