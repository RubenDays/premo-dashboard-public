import { useEffect, useRef, useState } from 'react';
import { Button, Form, Alert, Container, Row, Col } from 'react-bootstrap';
import { Navigate, useOutletContext } from 'react-router-dom'

import '../../utils/styles.css'

import { LOGIN_PATH } from '../../utils/paths';
import { FETCH_ERRORS, FETCH_STATUS, useFetch } from '../../utils/customHooks';
import { createRenewInterval } from '../../utils/funcs';
import MySpinner from '../MySpinner';

export default function Login() {
    const [ctx, setCtx] = useOutletContext()
    const usernameRef = useRef('')
    const passwordRef = useRef('')
    const [urlState, setUrlState] = useState('')

    const body = `grant_type=password&username=${usernameRef.current.value}&password=${passwordRef.current.value}`
    const configObj = {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': body.length,
            'Accept': 'application/json'
        },
        body: body
    }

    const loginState = useFetch(urlState, configObj)

    useEffect(() => {

        if (loginState.status === FETCH_STATUS.OK) {
            sessionStorage.setItem('loggedin', 'true')
            loginState.resp.session.renewInterval = createRenewInterval()
            setCtx(loginState.resp)
        }

    }, [loginState])

    function loginOnClickHandler(e) {
        e.preventDefault() // prevents page reload        
        setUrlState(LOGIN_PATH)
    }

    if (ctx) {
        return <Navigate to='/dashboard' replace />
        //return <Outlet replace />
    }

    function onCloseAlert() {
        setUrlState('')
    }

    function isServerError(status) {
        return status >= 500 && status <= 599
    }

    function isDisabled() {
        return urlState !== ''
    }

    return (
        //<div style={{ alignItems: 'center', justifyContent: 'center', display:'flex', width: '250px'}}>
            <Container /*style={{ alignItems: 'center', justifyContent: 'center', display:'flex'}}*/>
                <Row className="justify-content-md-center">
                    <Col />
                    <Col xs={4}>
                        <Alert variant='danger' show={loginState.status === FETCH_STATUS.NOK} onClose={onCloseAlert} dismissible>
                            <Alert.Heading className='text-center'>
                                {loginState.error === FETCH_ERRORS.BAD_REQUEST 
                                    ? 'As credenciais são inválidas'
                                    // in case the state resets after closing alert but before message disappearing
                                    : loginState.status !== FETCH_STATUS.NOK ? '' : 'Algo de errado ocorreu no servidor'}
                            </Alert.Heading>
                        </Alert>
                    </Col>
                    <Col />
                </Row>
                <Row>
                    <Col />
                    <Col xs={3}>
                        <Form onSubmit={loginOnClickHandler}>                
                            <Form.Group className="mb-3" controlId="username">
                                <Form.Label>Nome utilizador</Form.Label>
                                <Form.Control type="text" placeholder="Inserir nome utilizador" ref={usernameRef} disabled={isDisabled()} />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="password">
                                <Form.Label>Senha</Form.Label>
                                <Form.Control type="password" placeholder="Inserir senha" ref={passwordRef} disabled={isDisabled()} />
                            </Form.Group>
                            <Form.Group className='centered-btn-grp'>
                                <Button variant="generic" type="submit" disabled={isDisabled()} >
                                    { loginState.status === FETCH_STATUS.PENDING 
                                        ? <MySpinner className={'plain-div'} /> 
                                        : 'Iniciar sessão'
                                    }
                                </Button>
                            </Form.Group>
                        </Form>
                    </Col>
                    <Col />
                </Row>
            </Container>
        //</div>
        
    )
}