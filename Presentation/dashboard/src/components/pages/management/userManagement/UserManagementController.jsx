import { Button, Col, InputGroup, Form, Row} from "react-bootstrap";
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


export default function UserManagementController({ options }) {
    return (
        <Row style={{padding: '0 0 1rem 0'}}>

            <Col sm={7} style={{paddingLeft: '0'}}>
                <InputGroup>
                    <Button disabled variant="outline-secondary"> <FontAwesomeIcon icon={faMagnifyingGlass} /> </Button>
                    <Form.Control onChange={options.search.handler} type="text" defaultValue={options.search.value} placeholder="Procurar nomes de utilizador..." />
                </InputGroup>
            </Col>

            <Col>
                <Button className='btn-generic' onClick={options.addUser.handler}>
                    + Adicionar novo Utilizador
                </Button>
            </Col>
            
        </Row>
    )
}