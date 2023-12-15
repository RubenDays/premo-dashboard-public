import { useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'

import { KM_PATH } from '../../../../../utils/paths';
import { CovidFormGroup, COVID_OPTS, CutoffFormGroup, DatesFormGroup, DemographyFormGroup, FormTitleGroup, isColsErr, ParamsFormGroup, PatientIDsFormGroup, WaveFormGroup } from '../../../../../utils/forms/formComponents'
import { FormField, VerifyForms } from '../../../../../utils/forms/formVerifiers';
import { COLS_ERR, PARAM_CUTOFF_ERR } from '../../../../../utils/forms/formCodeErrors';


export default function SurvivalCurvesForm({ initDataForm, formRequest, setFormRequest }) {
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
            waves: [],
            covid: COVID_OPTS.AMBOS,
            demography: [],
            params: [],
            cutoffs: undefined
        }
    })

    function onSubmitHandler(ev) {
        ev.preventDefault()

        const formsToVerify = [
            FormField.PATIENT_IDS,
            FormField.DATES,
            FormField.COVID,
            FormField.WAVES,
            FormField.DEMOGRAPHY,
            FormField.PARAMS,
            FormField.CUTOFFS
        ]

        const formValues = { ...formState.contents}
        formValues.dates = {
            dateBegin: dateBeginRef.current.value,
            dateEnd: dateEndRef.current.value
        }
        formValues.demography = {
            demo: formState.contents.demography,
            validOptions: initFormState.demography
        }
        formValues.parameters = {
            params: formState.contents.params,
            validOptions: initFormState.daily_params 
        }
        const verified = VerifyForms(formsToVerify, formValues)
        console.log(verified)

        let newState = { ...formState }
        const params = formState.contents.params
        const demo = formState.contents.demography

        // wrong combination of demography/params        
        if (demo.length + params.length === 0) {
            verified.err += COLS_ERR
        } else if (demo.length > 1 || params.length > 1) {
            verified.err += COLS_ERR
        } else if (demo.length + params.length > 2) {
            verified.err += COLS_ERR
        }

        // in case there's param selected without cutoffs. KM
        if (formState.contents.resDaily && params.length > 0 && !formState.contents.cutoffs) {
            verified.err += PARAM_CUTOFF_ERR
        }
        
        let newFormRequest = { ...formRequest }
        if (verified.err !== 0) {
            // do errors
            newState.err = verified.err
            newFormRequest.url = ''
            newFormRequest.graph_type = ''
        } else {
            newState.err = 0
            newFormRequest.url = KM_PATH + verified.queryStr
            newFormRequest.graph_type = 'km'
        }
        
        setFormState(newState)
        setFormRequest(newFormRequest)
    }

    function setCutoff(value, err) {
        let newState = { ...formState }
        newState.contents.cutoffs = value
        newState.url = ''
        newState.err = err
        setFormState(newState)
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

    function onSelectDemography(values) {
        let newState = { ...formState }
        newState.contents.demography = values
        newState.url = ''
        return setFormState(newState)
    }

    function onSelectWaves(values) {
        let newState = {...formState}
        newState.contents.waves = values
        return setFormState(newState)
    }

    function onChangeCovid(ev) {
        let newState = {...formState}
        newState.contents.covid = ev.target.value
        return setFormState(newState)
    }

    return (
        <div>
            <FormTitleGroup title={t("surv-curves-form.title")} />
            <Form noValidate onSubmit={onSubmitHandler}>

                <PatientIDsFormGroup err={formState.err} setPatientIds={setPatientIds} />

                <DatesFormGroup err={formState.err} dateBeginRef={dateBeginRef} dateEndRef={dateEndRef} />

                <WaveFormGroup 
                    err={formState.err}
                    values={formState.contents.waves}
                    options={initFormState.waves}
                    onSelectWaves={onSelectWaves}
                />

                <CovidFormGroup err={formState.err} onChangeCovid={onChangeCovid} />

                {isColsErr(formState.err) ? <Form.Label className='error-text'> {t("surv-curves-form.cols-err")} </Form.Label> : <></>}

                <DemographyFormGroup 
                    err={formState.err}
                    values={formState.contents.demography}
                    options={initFormState.demography}
                    onSelectDemography={onSelectDemography}
                />

                <ParamsFormGroup 
                    err={formState.err}
                    maxSelected={1}
                    values={formState.contents.params}
                    options={initFormState.daily_params}
                    onSelectParams={onSelectParams}
                />

                <CutoffFormGroup err={formState.err} setCutoff={setCutoff} />
                
                {/*KM button*/}
                <Form.Group className='centered-btn-grp' style={{paddingTop: '1rem'}}>
                    <Button type="submit" className='btn-generic'>
                    {t("surv-curves-form.visualize-btn")}
                    </Button>
                </Form.Group>

            </Form>
        </div>
    )
}