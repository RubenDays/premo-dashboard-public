import { Form, InputGroup, Row, Col, Container } from 'react-bootstrap';
import SelectCheckBox from '../../SelectCheckBox';

export default function KMPlotController({ options }) {

  return (
      <Container>
        <Row>

          {/* select wave controller */}
          <Col>
            <Form.Group style={{width: '178px'}}>
                  <SelectCheckBox
                    value={options.waves.value}
                    maxSelected={1}
                    isMulti
                    onChangeHandler={options.waves.handler}
                    options={options.waves.options} 
                    placeholder={'Escolher Vaga'} />
            </Form.Group>
          </Col>

          {/* toggle show separated waves controller */}
          <Col>
            <Form.Group>
              <InputGroup>
                  <Form.Check 
                    type="checkbox"
                    checked={options.separateWaves.isChecked} 
                    onChange={options.separateWaves.handler} 
                    label='Separar por vagas' 
                  />                
              </InputGroup>
            </Form.Group>
          </Col>

        </Row>
      </Container>
  )
}
