import { Outlet, useOutletContext } from 'react-router-dom'

import { Col, Container, Row } from 'react-bootstrap';
import SideBar from './SideBar';

export default function SideNavBar() {
    const [ctx, setCtx] = useOutletContext()

    return (
       <div>
            <Container fluid>
                <Row>
                    <Col xs={2} id='sidebar-wrapper'>
                       <SideBar />
                    </Col>
                    <Col xs={10} id='page-content-wrapper'>
                        <Outlet context={[ctx, setCtx]} />
                    </Col>                      
                </Row>
            </Container>
       </div> 
    )

}