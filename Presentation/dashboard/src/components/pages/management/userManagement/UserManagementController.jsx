import { Button, Col, InputGroup, Form, Row} from "react-bootstrap";
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";


export default function UserManagementController({ options }) {
    const { t } = useTranslation()

    return (
        <Row style={{padding: '0 0 1rem 0'}}>

            <Col sm={7} style={{paddingLeft: '0'}}>
                <InputGroup>
                    <Button disabled variant="outline-secondary"> <FontAwesomeIcon icon={faMagnifyingGlass} /> </Button>
                    <Form.Control onChange={options.search.handler} type="text" defaultValue={options.search.value} placeholder={t("manage-users-page.controller.search-placeholder")} />
                </InputGroup>
            </Col>

            <Col>
                <Button className='btn-generic' onClick={options.addUser.handler}>
                    {t("manage-users-page.controller.add-user-btn")}
                </Button>
            </Col>
            
        </Row>
    )
}