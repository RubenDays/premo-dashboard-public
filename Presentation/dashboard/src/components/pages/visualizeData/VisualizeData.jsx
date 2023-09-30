import { useEffect, useState } from 'react';
import { Row, Col, Container } from 'react-bootstrap';

import { useOutletContext } from 'react-router-dom';

import { FETCH_ERRORS, FETCH_STATUS, useFetch } from '../../../utils/customHooks';
import { getErrorCode } from '../../../utils/forms/formVerifiers';
import MySpinner from '../../MySpinner';


export default function VisualizeData({ FormToRender, graphsToRender }) {
    const [ctx, setCtx] = useOutletContext()
    const [dataState, setDataState] = useState({
        data: {},
        graph_type: ''
    })

    const [formRequest, setFormRequest] = useState({
        err: 0,
        url: '',
        graph_type: ''
    })

    const fetchState = useFetch(formRequest.url)

    useEffect(() => {
        if (fetchState.status === FETCH_STATUS.OK) {
            setDataState({
                data: fetchState.resp,
                graph_type: formRequest.graph_type
            })
        } else if (fetchState.status === FETCH_STATUS.NOK) {
            if (fetchState.error === FETCH_ERRORS.BAD_REQUEST) {
                const err = getErrorCode(Object.keys(fetchState.resp))
                const newFormRequest = {
                    err: err,
                    url: '',
                    graph_type: ''
                }
                setFormRequest(newFormRequest)
            }
        }
    }, [fetchState])

    return (
        <Container className='ctn-visualize'>
            <Row>
                <Col sm={3} className='form-visualize'>
                    <FormToRender
                        initDataForm={ctx.data.init_form_data}
                        formRequest={formRequest}
                        setFormRequest={setFormRequest}
                    />
                </Col>
                <Col sm={9} className='plot-visualize'>
                    { fetchState.status === FETCH_STATUS.PENDING && <MySpinner /> }
                    { fetchState.status === FETCH_STATUS.OK && graphsToRender(dataState.graph_type, dataState.data) }
                </Col>
                
            </Row>
        </Container>                 
    )

}