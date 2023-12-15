import { useEffect, useState } from "react";
import { Form, Button, Alert, Container, Row } from "react-bootstrap";
import { useTranslation } from 'react-i18next'

import { FETCH_STATUS, useFetch } from "../../utils/customHooks";
import { FormTitleGroup } from "../../utils/forms/formComponents";
import { IMPORT_PATH } from "../../utils/paths";
import MySpinner from "../MySpinner";

export default function Import() {
    const { t } = useTranslation()

    const [state, setState] = useState({
        url: '',
        body: {},
        file: undefined
    })

    const [error, setError] = useState(false)

    const fetchState = useFetch(state.url, { method: 'POST', body: state.body })

    useEffect(() => {
        if (fetchState.isOk()) {

        } else if (fetchState.isNok()) {
            setError(true)
        }
        console.log(fetchState.resp)
    }, [fetchState])

    function handleFileChange(ev) {
        if (ev.target.files != null && ev.target.files.length > 0) {
            setState({
                url: '',
                body: {},
                file: ev.target.files[0]
            })
        }    
    }

    function importOnClickHandler(ev) {
        ev.preventDefault()
        if (!state.file) {
            return
        }

        const formData = new FormData()
        formData.append('zip_file', state.file)

        let newState = { ...state }
        newState.body = formData
        newState.url = IMPORT_PATH
        setState(newState)
    }

    function onCloseAlert() {
        setError(false)
    }

    return (
        <Container style={{ alignItems: 'center', justifyContent: 'center', display:'grid'}}>
            <Row>
                <Alert variant='danger' show={error} onClose={onCloseAlert} dismissible>
                    <Alert.Heading className='text-center'>
                        {t("import-form.error")}
                    </Alert.Heading>
                </Alert>
            </Row>
            
            <Row style={{justifyContent: 'center'}}>
                <Form style={{width: '350px'}} noValidate onSubmit={importOnClickHandler}>
                    <FormTitleGroup title={t("import-form.title")} />
                    <Form.Group controlId="formFile" className="mb-3">
                        <Form.Control onChange={handleFileChange} type="file" />
                    </Form.Group>
                    <Form.Group className='centered-btn-grp'>
                        <Button variant="generic" type="submit" >
                            { fetchState.status === FETCH_STATUS.PENDING 
                                ?   <MySpinner className={'plain-spinner'}/>
                                :   t("import-form.import-btn")
                            }
                        </Button>
                    </Form.Group>
                </Form>
            </Row>
            
        </Container>
    )
} 