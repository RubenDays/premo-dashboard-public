import { useEffect, useState } from "react";
import { Modal, InputGroup, Form, Button } from "react-bootstrap";
import { FETCH_ERRORS, useFetch } from "../../../../utils/customHooks";
import { getGeneralErrorCode } from "../../../../utils/forms/formVerifiers";
import { addError } from "../../../../utils/funcs";
import { MANAGEMENT_USERS_PATH } from "../../../../utils/paths";
import { verifyUsername } from "../../../../utils/verifications";
import MySpinner from "../../../MySpinner";
import SelectCheckBox from "../../../SelectCheckBox";
import { useTranslation } from "react-i18next";


const USERNAME_ERROR = 1
const STATUS_ERROR = 2
const ROLE_ERROR = 4
const RESET_PWD_ERROR = 8

const ERRORS = {
    username: USERNAME_ERROR,
    status: STATUS_ERROR,
    role: ROLE_ERROR,
    reset_pwd: RESET_PWD_ERROR
}

const ROLES = ['admin', 'user']
const ROLES_OPTS = ROLES.map(role => { return {
    label: role,
    value: role
}})

const DEFAULT_FORM_STATE = {
    err: 0,
    url: '',
    form: {
        username: undefined,
        enabled: undefined,
        role: undefined,
        resetPwd: false
    }
}

export default function UpdUserModal({ showModal, user, setUpdUserState}) {
    const { t } = useTranslation()
    const [formState, setFormState] = useState(DEFAULT_FORM_STATE)

    const STATUS_OPTS = [
        {label: t("update-user-form.state.active"), value: true},
        {label: t("update-user-form.state.inactive"), value: false}
    ]

    const fetchState = useFetch(formState.url, { 
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            username: formState.form.username,
            enabled: formState.form.enabled ? formState.form.enabled.value : undefined,
            role: formState.form.role ? formState.form.role.value : undefined,
            reset_pwd: formState.form.resetPwd
        })
    })

    useEffect(() => {
        if (fetchState.isOk()) {
            setUpdUserState({
                showModal: false,
                userForm: {
                    username: formState.form.username,
                    enabled: formState.form.enabled.value,
                    role: formState.form.role.value,
                    resetPwd: formState.form.resetPwd
                }
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

    useEffect(() => {
        if (user) {
            setFormState({
                err: 0,
                form: {
                    username: user.username,
                    enabled: user.enabled ? STATUS_OPTS[0] : STATUS_OPTS[1],
                    role: { label: user.role, value: user.role },
                    resetPwd: false,
                }
            })
        }
    }, [user]) 

    function handleCloseModal() {
        setUpdUserState({
            showModal: false,
            userForm: undefined
        })
    }

    function onChangeEnabled(value) {
        let newFormState = { ...formState }
        newFormState.form.enabled = value
        setFormState(newFormState)
    }

    function onChangeRole(value) {
        let newFormState = { ...formState }
        newFormState.form.role = value
        setFormState(newFormState)
    }

    function toggleResetPwd() {
        let newFormState = { ...formState }
        newFormState.form.resetPwd = !newFormState.form.resetPwd
        setFormState(newFormState)
    }

    function handleAcceptModal() {
        let err = 0
        // verifications
        if (formState.form.username !== user.username || !verifyUsername(formState.form.username)) {
            err = addError(formState.err, USERNAME_ERROR)
        }

         // verify enabled
         if (!formState.form.enabled || typeof formState.form.enabled.value !== 'boolean') {
            err = addError(formState.err, STATUS_ERROR)
        }

         // verify role
         if (!formState.form.role || !ROLES.includes(formState.form.role.value)) {
            err = addError(formState.err, ROLE_ERROR)
        }

        if (typeof formState.form.resetPwd !== 'boolean') {
            err = addError(formState.err, RESET_PWD_ERROR)
        }
   
        // update state
        let newFormState = { ...formState }
        if (err !== 0) {
            newFormState.url = ''
        } else {
            newFormState.url = MANAGEMENT_USERS_PATH + `/${formState.form.username}`
        }
        newFormState.err = err
        setFormState(newFormState)
    }

    if (!user) return <></>

    return (
        <Modal show={showModal} backdrop={fetchState.isPending() ? 'static' : 'true'} onHide={handleCloseModal}>
            <Modal.Header closeButton={!fetchState.isPending()} >
                <Modal.Title> {t("update-user-form.title")} </Modal.Title>
            </Modal.Header>

            <Modal.Body>

                {/* username */}
                <InputGroup className="mb-3">
                    <Form.Label style={{paddingTop: '0.3rem', paddingRight: '0.5rem'}}> {t("update-user-form.username")} </Form.Label>
                    <Form.Control 
                        disabled
                        defaultValue={user.username}
                        type='text'
                        style={{width: '10px'}}
                    />
                </InputGroup>

                {/* role */}
                <InputGroup className="mb-3">
                    <Form.Label style={{paddingTop: '0.3rem', paddingRight: '0.5rem'}}> {t("update-user-form.role")} </Form.Label>
                    <SelectCheckBox
                        className={'basic-single'}
                        value={[formState.form.role]}
                        options={ROLES_OPTS}
                        onChangeHandler={onChangeRole}
                    />
                </InputGroup>

                {/* status */}
                <InputGroup className="mb-3">
                    <Form.Label style={{paddingTop: '0.3rem', paddingRight: '0.5rem'}}> {t("update-user-form.state.name")} </Form.Label>
                    <SelectCheckBox
                        className={'basic-single'}
                        value={[formState.form.enabled]}
                        options={STATUS_OPTS}
                        onChangeHandler={onChangeEnabled}
                    />
                </InputGroup>

                {/* reset password */}
                <Form.Group className='mb-3'>
                    <Form.Check 
                        style={{fontSize: '15px'}}
                        type='checkbox'
                        id='cb-min-max-res'
                        label={t("update-user-form.reset-pwd-cb")}
                        onChange={toggleResetPwd} 
                    />
                </Form.Group>

            </Modal.Body>

            <Modal.Footer style={{justifyContent: 'center'}}>
                <Button disabled={formState.err !== 0 || fetchState.isPending()} className='btn-generic' onClick={handleAcceptModal}>
                    { fetchState.isPending() 
                        ? <MySpinner className={'plain-div'} />
                        : t("update-user-form.upd-btn")
                    }
                </Button>
            </Modal.Footer>

        </Modal>
    )
} 