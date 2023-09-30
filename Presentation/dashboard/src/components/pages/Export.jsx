import { useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';

import { FETCH_ERRORS, useFetch } from '../../utils/customHooks'
import { EXPORT_PATH } from '../../utils/paths';
import { isPatientIDsInputValid, isValidDate } from '../../utils/verifications';
import { FETCH_STATUS } from '../../utils/customHooks';
import MySpinner from '../MySpinner';
import { DatesFormGroup, FormTitleGroup, PatientIDsFormGroup } from '../../utils/forms/formComponents';
import { getErrorCode } from '../../utils/forms/formVerifiers';


export default function Export() {
    const dateBeginRef = useRef()
    const dateEndRef = useRef()

    const [formState, setFormState] = useState({
        err: 0,
        url: '',
        contents: {
            patientIDs: undefined
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

        const queryParts = []

        let err = 0

        // final verification for patient IDs input
        if (formState.contents.patientIDs) {
            // if patientIDs input is not valid, mark with error
            if (!isPatientIDsInputValid(formState.contents.patientIDs)) {
                err = 1
            } else {
            // else construct the query string
                queryParts.push(`patient_ids=${formState.contents.patientIDs.trim()}`)
            }
        }

        // final verification of date begin input
        if (dateBeginRef.current.value) {
            if (!isValidDate(dateBeginRef.current.value)) {
                 // date begin error          
                 err += 2
            }
            queryParts.push(`begin_date=${dateBeginRef.current.value}`)
        }

        // final verification of date end input
        if (dateEndRef.current.value) {
            if (!isValidDate(dateEndRef.current.value)) {
                 // date end error
                 err += 4
            }
            queryParts.push(`end_date=${dateEndRef.current.value}`)
        }

        // if both dates are valid, check if "begin" is before "end"
        // if both dates didn't result in error
        if (err < 2) {
            // if both have values
            if (dateBeginRef.current.value && dateEndRef.current.value) {
                const dateBegin = Date.parse(dateBeginRef.current.value)
                const dateEnd = Date.parse(dateEndRef.current.value)
                // if "date begin" is bigger than "date end"
                if (dateBegin > dateEnd) {
                    // error from both dates (4+2)
                    err += 6
                }
            }
        }

        let queryStr = EXPORT_PATH
        if (queryParts.length > 0) {
            queryStr += `?${queryParts.join('&')}`
        }
        
        let newState = { ...formState }
        if (err === 0) {           
            newState.err = 0
            newState.url = queryStr
        } else {
            newState.err = err
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

    return (
        <div style={{ alignItems: 'center', justifyContent: 'center', display:'flex'}}>           
            <Form noValidate onSubmit={exportOnClickHandler}>

                <FormTitleGroup title='Export Dados' />

                <PatientIDsFormGroup err={formState.err} setPatientIds={setPatientIds} />

                <DatesFormGroup err={formState.err} dateBeginRef={dateBeginRef} dateEndRef={dateEndRef} />

                <Form.Group className='centered-btn-grp'>
                    <Button variant="generic" type="submit" >
                        { fetchState.status === FETCH_STATUS.PENDING 
                            ?   <MySpinner className={'plain-spinner'}/>
                            :   'Exportar'
                        }
                    </Button>
                </Form.Group>
            </Form>
        </div>
    )
}