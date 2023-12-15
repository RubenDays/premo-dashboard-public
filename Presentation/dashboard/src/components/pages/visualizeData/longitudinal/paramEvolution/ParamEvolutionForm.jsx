import { useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'

import { COLS_ERR } from '../../../../../utils/forms/formCodeErrors';
import { DatesFormGroup, isColsErr, PatientIDsFormGroup, ParamsFormGroup, FormTitleGroup, FormRatioParams } from '../../../../../utils/forms/formComponents';
import { FormField, VerifyForms } from '../../../../../utils/forms/formVerifiers';
import { LONG_AGGR_PATH, LONG_SEPARATED_PATH } from '../../../../../utils/paths';


const MAX_RATIO_ALLOWED = 1

export default function ParamEvolutionForm({ initDataForm, formRequest, setFormRequest }) {
    const { t } = useTranslation()

    const dateBeginRef = useRef()
    const dateEndRef = useRef()

    // initial options for forms
    const [initFormState, setInitFormState] = useState({
        params: [],
        waves: [],
        demography: [],
        daily_params: []
    })

    useEffect(() => {
        const params = initDataForm.params.map(param => (
            { value: param.value, label: param.display_name }
        ))
    
        const waves = initDataForm.waves.map(wave => (
            { value: `${wave}`, label: wave }
        ))

        const demography = initDataForm.demography.map(demo => (
            { value: demo.value, label: demo.display_name }
        ))

        const daily_params = initDataForm.daily_params.map(daily_param => (
            { value: daily_param.value, label: daily_param.display_name }
        ))

        setInitFormState({params, waves, demography, daily_params})
    }, [initDataForm])

    // values present on form
    const [formState, setFormState] = useState({
        err: 0,
        contents: {
            patientIDs: undefined,
            params: [],
            resDaily: false,
            separatePatients: false,
            paramsRatio: {
                params: Array.apply([], {length: MAX_RATIO_ALLOWED * 2}),
                maxAllowed: MAX_RATIO_ALLOWED
            }
        }
    })

    function onSubmitHandler(ev) {
        ev.preventDefault()

        const formsToVerify = [
            FormField.PATIENT_IDS,
            FormField.DATES,
            FormField.PARAMS,
            FormField.RES_DAILY,
            FormField.SEPARATE_PACIENTS,
            FormField.RATIO_PARAM
        ]

        const formValues = { ...formState.contents}
        formValues.dates = {
            dateBegin: dateBeginRef.current.value,
            dateEnd: dateEndRef.current.value
        }
        formValues.parameters = {
            params: formState.contents.params,
            validOptions: formState.contents.resDaily ? initFormState.daily_params : initFormState.params 
        }
        formValues.ratioParams = {
            selected: formState.contents.paramsRatio.params.map(elem => elem ? elem[0] : undefined),
            validOptions: formState.contents.resDaily ? initFormState.daily_params : initFormState.params
        }
        const verified = VerifyForms(formsToVerify, formValues)

        let newState = { ...formState }
        const paramsLen = formState.contents.params.length * 2
        const ratioParamsLen = formState.contents.paramsRatio.params.filter(elem => elem.length > 0).length

        let url = ''
        let graph_type = ''

        console.log(formState)

        // wrong combination of params    
        if (paramsLen + ratioParamsLen !== 2) {
            verified.err += COLS_ERR
        }

        let newFormRequest = { ...formRequest }
        
        if (verified.err !== 0) {
            // do errors
            newState.err = verified.err
            newFormRequest.url = ''
            newFormRequest.graph_type = ''
        } else {
            if (formState.contents.separatePatients) {
                url = LONG_SEPARATED_PATH
                graph_type = 'long-separated'
            } else {
                url = LONG_AGGR_PATH
                graph_type = 'long-aggr'
            }
            newFormRequest.url = url + verified.queryStr
            newFormRequest.graph_type = graph_type
            newState.err = 0
        }

        setFormState(newState)
        setFormRequest(newFormRequest)
    }

    function setPatientIds(values, err) {
        let newState = { ...formState }
        newState.contents.patientIDs = values
        newState.url = ''
        newState.err = err
        setFormState(newState)
    }   

    function onSelectParams(values) {
        let newState = {...formState}
        console.log(formState)
        newState.contents.params = values

        if (values.length > 0) {
            newState.contents.paramsRatio.params = newState.contents.paramsRatio.params.map(_ => [])
        }

        return setFormState(newState)
    }

    function onChangeResDaily(ev) {
        let newState = {...formState}

        newState.contents.resDaily = !newState.contents.resDaily
        formState.contents.params = []

        return setFormState(newState)
    }

    function toggleSeparatePacients() {
        let newState = {...formState}

        newState.contents.separatePatients = !newState.contents.separatePatients

        return setFormState(newState)
    }

    function onChangeRatioParams(value, index) {
        let newState = { ...formState }
        
        if (value.length > 0) {
            newState.contents.paramsRatio.params[index] = value
            newState.contents.params = newState.contents.params.slice(0, -1)
        } else {
            newState.contents.paramsRatio.params[index] = []
        }

        console.log(newState)
        setFormState(newState)
    }

    return (
        <div>
            <FormTitleGroup title={t("evol-params-form.title")} />
            <Form noValidate onSubmit={onSubmitHandler}>

                <PatientIDsFormGroup err={formState.err} setPatientIds={setPatientIds} />

                <DatesFormGroup err={formState.err} dateBeginRef={dateBeginRef} dateEndRef={dateEndRef} />

                {isColsErr(formState.err) ? <Form.Label className='error-text'> {t("evol-params-form.cols-err")} </Form.Label> : <></>}

                <Form.Group className='mb-3'>
                    <Form.Check
                        style={{fontSize: '15px'}}
                        type='checkbox'
                        id='cb-min-max-res'
                        label={t("evol-params-form.separate-patient-cb")}
                        onChange={toggleSeparatePacients}
                    />
                </Form.Group>

                <ParamsFormGroup
                    err={formState.err}
                    maxSelected={1}
                    values={formState.contents.params}
                    options={formState.contents.resDaily ? initFormState.daily_params : initFormState.params}
                    onSelectParams={onSelectParams}
                    onChangeResDaily={onChangeResDaily}
                />
                
                <FormRatioParams
                    err={formRequest.err}
                    selected={formState.contents.paramsRatio.params}
                    options={formState.contents.resDaily ? initFormState.daily_params : initFormState.params}
                    maxAllowed={formState.contents.paramsRatio.maxAllowed}
                    onChangeRatioParams={onChangeRatioParams}
                />

                {/*Long button*/}
                <Form.Group className='centered-btn-grp' style={{paddingTop: '1rem'}}>
                    <Button type="submit" className='btn-generic'>
                        {t("evol-params-form.visualize-btn")}
                    </Button>
                </Form.Group>

            </Form>
        </div>
    )
}
