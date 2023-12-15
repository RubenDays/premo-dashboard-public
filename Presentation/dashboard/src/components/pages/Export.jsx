import { useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'

import { FETCH_ERRORS, useFetch } from '../../utils/customHooks'
import { EXPORT_PATH } from '../../utils/paths';
import { isPatientIDsInputValid, isValidDate } from '../../utils/verifications';
import { FETCH_STATUS } from '../../utils/customHooks';
import MySpinner from '../MySpinner';
import { DatesFormGroup, DayUciFormGroup, DemographyFormGroup, FormTitleGroup, ParamsFormGroup, PatientIDsFormGroup, TherapyFormGroup } from '../../utils/forms/formComponents';
import { FormField, getErrorCode, VerifyForms } from '../../utils/forms/formVerifiers';
import { useOutletContext } from 'react-router-dom';


export default function Export() {
    const [ctx] = useOutletContext()
    const { t } = useTranslation()

    const dateBeginRef = useRef()
    const dateEndRef = useRef()

    const [initFormState, setInitFormState] = useState({
        params: [],
        demography: [],
        daily_params: [],
        therapy: []
    })

    useEffect(() => {
        const init_data = ctx.data.init_form_data

        const params = init_data.params.map(param => (
            { value: param.value, label: param.display_name }
        ))

        const demography = init_data.demography.map(demo => (
            { value: demo.value, label: demo.display_name }
        ))

        const daily_params = init_data.daily_params.map(daily_param => (
            { value: daily_param.value, label: daily_param.display_name }
        ))

        const therapy = init_data.therapy.map(t => (
            { value: t, label: t }
        ))

        setInitFormState({params, demography, daily_params, therapy})

    }, [])

    const [formState, setFormState] = useState({
        err: 0,
        url: '',
        contents: {
            patientIDs: undefined,
            params: [],
            demography: [],
            therapy: [],
            resDaily: false,
            dayUci: undefined
        }
    })
    
    const fetchState = useFetch(formState.url, {}, false)

    useEffect(() => {
        if (fetchState.status === FETCH_STATUS.OK) {
            let a = document.createElement('a')
            a.href = URL.createObjectURL(fetchState.resp)
            a.setAttribute('download', 'premo_export_patients.zip')
            a.click()
            a.remove()
        } else if (fetchState.status === FETCH_STATUS.NOK) {
            if (fetchState.error === FETCH_ERRORS.BAD_REQUEST) {
                const err = getErrorCode(Object.keys(fetchState.resp))
                let newState = { ...formState }
                newState.err = err
                newState.url = ''
                setFormState(newState)   
            }
        }
    }, [fetchState])

    function exportOnClickHandler(ev) {
        ev.preventDefault() // prevents page reload

        const formsToVerify = [
            FormField.PATIENT_IDS,
            FormField.DATES,
            FormField.DEMOGRAPHY,
            FormField.PARAMS,
            FormField.RES_DAILY,
            FormField.THERAPY,
            FormField.DAY_UCI,
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
        formValues.therapy = {
            t: formState.contents.therapy,
            validOptions: initFormState.therapy
        }
        formValues.parameters = {
            params: formState.contents.params,
            validOptions: formState.contents.resDaily ? initFormState.daily_params : initFormState.params
        }

        const verified = VerifyForms(formsToVerify, formValues)

        let newState = { ...formState }
        if (verified.err === 0) {           
            newState.err = 0
            newState.url = EXPORT_PATH + verified.queryStr
        } else {
            newState.err = verified.err
            newState.url = ''            
        }

        setFormState(newState)
    }

    function setPatientIds(values, err) {
        let newState = { ...formState }
        newState.contents.patientIDs = values
        newState.url = ''
        newState.err = err
        setFormState(newState)
    }

    function onChangeResDaily(ev) {
        let newState = { ...formState }
        newState.contents.resDaily = !newState.contents.resDaily
        newState.contents.params = []
        newState.contents.daily_params = []
        setFormState(newState)
    }

    function onSelectParams(values) {
        let newState = {...formState}
        newState.contents.params = values
        return setFormState(newState)
    }

    function onSelectDemography(values) {
        let newState = {...formState}
        newState.contents.demography = values
        return setFormState(newState)
    }

    function onSelectTherapy(values) {
        let newState = {...formState}
        newState.contents.therapy = values
        return setFormState(newState)
    }

    function setDayUci(value, err) {
        let newState = { ...formState }
        newState.contents.dayUci = value
        newState.url = ''
        newState.err = err
        setFormState(newState)
    }

    return (
        <div className='export-form'>
            <Form noValidate onSubmit={exportOnClickHandler}>

                <FormTitleGroup title={t("export-form.title")} />

                <PatientIDsFormGroup err={formState.err} setPatientIds={setPatientIds} />

                <DatesFormGroup err={formState.err} dateBeginRef={dateBeginRef} dateEndRef={dateEndRef} />

                <DayUciFormGroup err={formState.err} setDayUci={setDayUci} />

                <DemographyFormGroup 
                    err={formState.err} 
                    values={formState.contents.demography}
                    options={initFormState.demography}
                    onSelectDemography={onSelectDemography}
                    selectAll={t("form-fields.demography.select-all")}
                />

                <ParamsFormGroup 
                    err={formState.err} 
                    values={formState.contents.params}
                    options={formState.contents.resDaily ? initFormState.daily_params : initFormState.params}
                    onSelectParams={onSelectParams}
                    onChangeResDaily={onChangeResDaily}
                    selectAll={t("form-fields.parameters.select-all")}
                />

                <TherapyFormGroup 
                    err={formState.err} 
                    values={formState.contents.therapy}
                    options={initFormState.therapy}
                    onSelectTherapy={onSelectTherapy}
                    selectAll={t("form-fields.therapy.select-all")}
                />

                <Form.Group className='centered-btn-grp'>
                    <Button variant="generic" type="submit" >
                        { fetchState.status === FETCH_STATUS.PENDING 
                            ?   <MySpinner className={'plain-spinner'}/>
                            :   t("export-form.export-btn")
                        }
                    </Button>
                </Form.Group>
            </Form>
        </div>
    )
}