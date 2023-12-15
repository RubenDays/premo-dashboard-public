import { useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'

import { COLS_ERR, OK } from '../../../../utils/forms/formCodeErrors';
import { UciFormGroup, ParamsFormGroup, CovidFormGroup, WaveFormGroup, PatientIDsFormGroup, DatesFormGroup, DemographyFormGroup, isColsErr, DayUciFormGroup, FormTitleGroup, COVID_OPTS, UCI_OPTS, FormRatioParams } from '../../../../utils/forms/formComponents';
import { FormField, VerifyForms } from '../../../../utils/forms/formVerifiers';
import { BOXPLOT_PATH, NOMINAL_VALS_PATH, QUANT_VALS_PATH  } from '../../../../utils/paths';

const MAX_RATIO_ALLOWED = 2

function createEmptyArray(size) {
    let arr = Array(size)
    for (let i; i < size; i++) {
        arr[i] = []
    }

    return arr
}

export default function VisualizeStatsForm({ initDataForm, formRequest, setFormRequest }) {
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
    
        const waves = initDataForm.waves.map(vaga => (
            { value: `${vaga}`, label: vaga }
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
        disablePVals: false, // just a way to indicate in the graph controllers if p vals is disabled or not
        contents: {
            patientIDs: undefined,
            waves: [],
            covid: COVID_OPTS.AMBOS,
            uci: UCI_OPTS.AMBOS,
            demography: [],
            params: [],
            resDaily: false,
            dayUci: '',
            paramsRatio: {
                params: createEmptyArray(MAX_RATIO_ALLOWED * 2),
                maxAllowed: MAX_RATIO_ALLOWED
            }
        }
    })

    function onSubmitHandler(ev) {
        ev.preventDefault()

        const formsToVerify = [
            FormField.PATIENT_IDS,
            FormField.DATES,
            FormField.DAY_UCI,
            FormField.COVID,
            FormField.UCI,
            FormField.WAVES,
            FormField.DEMOGRAPHY,
            FormField.PARAMS,
            FormField.RES_DAILY,
            FormField.RATIO_PARAM
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
            validOptions: formState.contents.resDaily ? initFormState.daily_params : initFormState.params
        }
        formValues.ratioParams = {
            selected: formState.contents.paramsRatio.params.map(elem => elem ? elem[0] : undefined),
            validOptions: formState.contents.resDaily ? initFormState.daily_params : initFormState.params
        }
        const verified = VerifyForms(formsToVerify, formValues)

        let newState = { ...formState }
        const params = formState.contents.params
        const demo = formState.contents.demography
        let disablePVals = false

        let url = ''
        let graph_type = ''
        // params count as 2, because to form a ratio param it's required 2 params
        const paramsLen = params.length * 2 + formState.contents.paramsRatio.params.filter(elem => elem.length != 0).length
        console.log(paramsLen)
        console.log(formState)

        // Nominal graphs (e.g. circular) - Only 1 demography selected and no params
        if (demo.length == 1 && paramsLen == 0) {
            url = NOMINAL_VALS_PATH + verified.queryStr
            graph_type = 'nominal'
        // Nominal-Quantitative graphs (e.g. boxplot/bars) - Only 1 demography and 1 param, or only 1 param
        } else if ((demo.length == 1 && paramsLen == 2) ||
         (demo.length == 0 && paramsLen == 2)) {
            url = BOXPLOT_PATH + verified.queryStr
            graph_type = 'nominal-quant'
            if (!formState.contents.resDaily || !formState.contents.dayUci) {
                disablePVals = true
            }
        // Quantitative graphs (e.g. scatterplot) - 2 params and no demography
        } else if (demo.length == 0 && paramsLen == 4) {
            url = QUANT_VALS_PATH + verified.queryStr
            graph_type = 'quant' 
        } else {
            verified.err += COLS_ERR
        }

        let newFormRequest = { ...formRequest }
        
        if (verified.err !== OK) {
            // do errors
            newFormRequest.err = verified.err
            newFormRequest.url = ''
            newFormRequest.graph_type = ''
        } else {
            newFormRequest.url = url
            newFormRequest.graph_type = graph_type
            newState.disablePVals = disablePVals
            newFormRequest.err = OK
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
        const maxAllowed = MAX_RATIO_ALLOWED - values.length

        if (maxAllowed >= newState.contents.paramsRatio.maxAllowed) {
            console.log('oi')
            for (let i = 0; i < maxAllowed - newState.contents.paramsRatio.maxAllowed; i++) {
                newState.contents.paramsRatio.params.push([])
                newState.contents.paramsRatio.params.push([])
            }
        } else {
            newState.contents.paramsRatio.params = newState.contents.paramsRatio.params.slice(0, -2)
        }

        newState.contents.paramsRatio.maxAllowed = maxAllowed
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

    function onChangeUci(ev) {
        let newState = {...formState}
        newState.contents.uci = ev.target.value
        return setFormState(newState)
    }

    function onChangeResDaily(ev) {
        let newState = {...formState}

        newState.contents.resDaily = !newState.contents.resDaily
        formState.contents.params = []

        return setFormState(newState)
    }

    function setDayUci(value, err) {
        let newState = { ...formState }
        newState.contents.dayUci = value
        newState.url = ''
        newState.err = err
        setFormState(newState)
    }

    function onChangeRatioParams(value, index) {
        let newState = { ...formState }
        
        if (value.length > 0) {
            newState.contents.paramsRatio.params[index] = value
            const count = newState.contents.paramsRatio.params.filter(p => p.length != 0).length
            console.log(count)

            if (count + (newState.contents.params.length * 2) > MAX_RATIO_ALLOWED * 2) {
                newState.contents.params = newState.contents.params.slice(0, -1)
                newState.contents.paramsRatio.maxAllowed++
            }
        } else {
            newState.contents.paramsRatio.params[index] = []
        }

        setFormState(newState)
    }

    return (
        <div>
            <FormTitleGroup title={t("cross-data-form.title")} helpMsg={graphHelp(t)} />

            <Form noValidate onSubmit={onSubmitHandler}>

                <PatientIDsFormGroup err={formRequest.err} setPatientIds={setPatientIds} />

                <DatesFormGroup err={formRequest.err} dateBeginRef={dateBeginRef} dateEndRef={dateEndRef} />

                <DayUciFormGroup err={formRequest.err} setDayUci={setDayUci} />

                <WaveFormGroup 
                    err={formRequest.err}
                    values={formState.contents.waves}
                    options={initFormState.waves}
                    onSelectWaves={onSelectWaves}
                />

                <CovidFormGroup err={formRequest.err} onChangeCovid={onChangeCovid} />

                <UciFormGroup err={formRequest.err} onChangeCovid={onChangeUci} />

                {isColsErr(formRequest.err) ? <Form.Label className='error-text'> {t("cross-data-form.cols-err")} </Form.Label> : <></>}

                <DemographyFormGroup
                    err={formRequest.err}
                    values={formState.contents.demography}
                    options={initFormState.demography}
                    onSelectDemography={onSelectDemography}
                />

                <ParamsFormGroup
                    err={formRequest.err}
                    maxSelected={2}
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
                
                {/*Visualizar button*/}
                <Form.Group className='centered-btn-grp'>
                    <Button type="submit" className='btn-generic'>
                        {t("cross-data-form.visualize-btn")}
                    </Button>
                </Form.Group>

            </Form>
        </div>
    )
}

function graphHelp(t) {
    return (
        <div>
            {t("cross-data-form.help.title")}<br />
            <ul>
                <li>{t("cross-data-form.help.circular")}</li>
                <li>{t("cross-data-form.help.boxplot")}</li>
                <li>{t("cross-data-form.help.scatter")}</li>
            </ul>
        </div>
    )
}
