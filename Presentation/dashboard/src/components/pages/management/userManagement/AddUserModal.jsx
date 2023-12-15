import { useEffect, useState } from "react";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { FETCH_ERRORS, useFetch } from "../../../../utils/customHooks";
import { getGeneralErrorCode } from "../../../../utils/forms/formVerifiers";
import { addError, removeError } from "../../../../utils/funcs";
import { MANAGEMENT_USERS_PATH } from "../../../../utils/paths";
import MySpinner from "../../../MySpinner";
import SelectCheckBox from "../../../SelectCheckBox";
import { useTranslation } from "react-i18next";


const STATUS_OPTS = [
    {label: 'Ativo', value: true},
    {label: 'Desativo', value: false}
]

function getDefaultFormState() {
    return {
        err: 0,
        url: '',
        form: {
            username: '',
            role: 'user',
            enabled: STATUS_OPTS[0],
        }
    }
} 

const USERNAME_ERROR = 1
const STATUS_ERROR = 2
const ROLE_ERROR = 4

const ERRORS = {
    username: USERNAME_ERROR,
    status: STATUS_ERROR,
    role: ROLE_ERROR
}

export default function AddUserModal({ showModal, setAddUserState }) {
    const { t } = useTranslation()

    const [formState, setFormState] = useState(getDefaultFormState())
    const fetchState = useFetch(formState.url, { 
        method: 'POST',
        body: JSON.stringify({
            username: formState.form.username,
            enabled: formState.form.enabled.value,
            role: formState.form.role,
        }),
        headers: { 'content-type': 'application/json' }
    })

    useEffect(() => {
        // clear modal if it's hidden
        if (!showModal) {
            setFormState(getDefaultFormState())
        }

    }, [showModal])

    useEffect(() => {
        if (fetchState.isOk()) {
            setAddUserState({
                showModal: false,
                userForm: formState.form
            })
        } else if (fetchState.isNok()) {
            if (fetchState.error === FETCH_ERRORS.BAD_REQUEST) {
                const err = getGeneralErrorCode(Object.keys(fetchState.resp), ERRORS)
                const newFormState = { ...formState }
                newFormState.err = err
                newFormState.url = ''
                setFormState(newFormState)
            }
        }
    }, [fetchState])

    function onChangeUsername(ev) {
        let newFormState = { ...formState }
        newFormState.form.username = ev.target.value

        if (newFormState.form.username.length <= 15 && !/[^A-Za-z0-9]/.test(newFormState.form.username)) {
            newFormState.err = removeError(newFormState.err, USERNAME_ERROR)
        } else {
            newFormState.err = addError(newFormState.err, USERNAME_ERROR)
        }
        
        setFormState(newFormState)
    }

    function handleCloseModal() {
        setAddUserState({
            showModal: false,
            userForm: undefined
        })
    }

    function handleAcceptModal() {
        // verify again
        let err = 0
        // verify usename field
        if (!formState.form.username || formState.form.username.length > 15 || /[^A-Za-z0-9]/.test(formState.form.username)) {
            err = addError(formState.err, USERNAME_ERROR)
        }

        // verify enabled
        if (!formState.form.enabled || typeof formState.form.enabled.value !== 'boolean') {
            err = addError(formState.err, STATUS_ERROR)
        }

         // verify role
         if (!formState.form.role || formState.form.role !== 'user') {
            err = addError(formState.err, ROLE_ERROR)
        }

        // build url to make api call
        let newFormState = { ...formState }
        if (err !== 0) {
            newFormState.url = ''
        } else {
            newFormState.url = MANAGEMENT_USERS_PATH
        }
        newFormState.err = err
        setFormState(newFormState)
    }

    function onChangeEnabled(value) {
        let newFormState = { ...formState }
        newFormState.form.enabled = value
        setFormState(newFormState)
    }
    
    return (
        <Modal show={showModal} onHide={handleCloseModal} backdrop={fetchState.isPending() ? 'static' : 'true'} >
            <Modal.Header closeButton={!fetchState.isPending()}>
                <Modal.Title> {t("add-user-form.title")} </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <InputGroup className="mb-3">
                    <Form.Label style={{paddingTop: '0.3rem', paddingRight: '0.5rem'}}> {t("add-user-form.username")} </Form.Label>
                    <Form.Control 
                        defaultValue={formState.form.username}
                        onChange={onChangeUsername}
                        type='text'
                        style={{width: '10px'}}
                        isInvalid={formState.err & USERNAME_ERROR}
                    />
                </InputGroup>
                <InputGroup className="mb-3">
                    <Form.Label style={{paddingTop: '0.3rem', paddingRight: '0.5rem'}}> {t("add-user-form.role")} </Form.Label>
                    <SelectCheckBox
                        isDisabled
                        className={'basic-single'}
                        value={[{label: 'user', value: 'user'}]}
                        // options={DL_FORMATS}
                        // onChangeHandler={onChangeFormatExport}
                    />
                </InputGroup>
                <InputGroup className="mb-3">
                    <Form.Label style={{paddingTop: '0.3rem', paddingRight: '0.5rem'}}> {t("add-user-form.state")} </Form.Label>
                    <SelectCheckBox
                        className={'basic-single'}
                        value={[formState.form.enabled]}
                        options={STATUS_OPTS}
                        onChangeHandler={onChangeEnabled}
                    />
                </InputGroup>
            </Modal.Body>
            <Modal.Footer style={{justifyContent: 'center'}}>
                <Button disabled={!formState.form.username || formState.err !== 0 || fetchState.isPending()} className='btn-generic' onClick={handleAcceptModal}>
                    { fetchState.isPending() 
                        ? <MySpinner className={'plain-div'} />
                        : t("add-user-form.add-btn")
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    )
}