import { useEffect, useRef, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { FETCH_STATUS, useFetch } from '../../../../../utils/customHooks';
import { COLS_ERR } from '../../../../../utils/forms/formCodeErrors';
import { DatesFormGroup, isColsErr, PatientIDsFormGroup, ParamsFormGroup, FormTitleGroup } from '../../../../../utils/forms/formComponents';
import { FormField, getErrorCode, VerifyForms } from '../../../../../utils/forms/formVerifiers';
import { LONG_AGGR_PATH, LONG_SEPARATED_PATH } from '../../../../../utils/paths';


export default function ParamEvolutionForm({ initDataForm, formRequest, setFormRequest }) {
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
            separatePatients: false
        }
    })

    function onSubmitHandler(ev) {
        ev.preventDefault()

        const formsToVerify = [
            FormField.PATIENT_IDS,
            FormField.DATES,
            FormField.PARAMS,
            FormField.RES_DAILY,
            FormField.SEPARATE_PACIENTS
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
        const verified = VerifyForms(formsToVerify, formValues)

        let newState = { ...formState }
        const params = formState.contents.params

        let url = ''
        let graph_type = ''

        // wrong combination of params        
        if (params.length !== 1) {
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
        newState.contents.params = values
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

    return (
        <div>
            <FormTitleGroup title='Evolução Parâmetros' />
            <Form noValidate onSubmit={onSubmitHandler}>

                <PatientIDsFormGroup err={formState.err} setPatientIds={setPatientIds} />

                <DatesFormGroup err={formState.err} dateBeginRef={dateBeginRef} dateEndRef={dateEndRef} />

                {isColsErr(formState.err) ? <Form.Label className='error-text'> Valores de parâmetro inválidos. </Form.Label> : <></>}

                <Form.Group className='mb-3'>
                    <Form.Check
                        style={{fontSize: '15px'}}
                        type='checkbox'
                        id='cb-min-max-res'
                        label='Separar por paciente'
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

                {/*Long button*/}
                <Form.Group className='centered-btn-grp' style={{paddingTop: '1rem'}}>
                    <Button type="submit" className='btn-generic'>
                        Visualizar
                    </Button>
                </Form.Group>

            </Form>
        </div>
    )
}
