import { useEffect, useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { useFetch } from "../../../../utils/customHooks";
import { MANAGEMENT_USERS_PATH } from "../../../../utils/paths";
import MySpinner from "../../../MySpinner";
import { useTranslation } from "react-i18next";

export default function DelUserModal({ showModal, user, setDelUserState}) {
    const { t } = useTranslation()
    const [formState, setFormState] = useState({
        url: '',
        username: ''
    })

    const fetchState = useFetch(formState.url, { 
        method: 'DELETE'
    })

    useEffect(() => {
        if (user) {
            setFormState({
                url: '',
                username: user.username
            })
        }
    }, [user])

    useEffect(() => {
        if (fetchState.isOk()) {
            setDelUserState({
                showModal: false,
                userForm: { username: formState.username }
            })
        } else if (fetchState.isNok()) {

        }
    }, [fetchState])

    function handleAcceptModal() {
        let newFormState = { ...formState }
        newFormState.url = MANAGEMENT_USERS_PATH + `/${formState.username}`
        setFormState(newFormState)
    }

    function handleCloseModal() {
        setDelUserState({
            showModal: false,
            userForm: undefined
        })
    }

    if (!user) return <></>

    return (
        <Modal show={showModal} backdrop={fetchState.isPending() ? 'static' : 'true'} onHide={handleCloseModal}>
            <Modal.Header closeButton={!fetchState.isPending()} >
                <Modal.Title> {t("delete-user-form.title")} </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Label style={{paddingTop: '0.3rem', paddingRight: '0.5rem'}}> {t("delete-user-form.msg")} <b>{formState.username}</b>?</Form.Label>
            </Modal.Body>
            <Modal.Footer style={{justifyContent: 'center'}}>
                <Button disabled={fetchState.isPending()} className='btn-generic' onClick={handleAcceptModal}>
                    { fetchState.isPending()
                        ? <MySpinner className={'plain-div'} />
                        : t("delete-user-form.delete-btn")
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    )
}