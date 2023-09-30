import { Form, InputGroup, Row, Col, Container, OverlayTrigger, Tooltip, Button, Image } from 'react-bootstrap';
import SelectCheckBox from '../../SelectCheckBox';

export default function BoxPlotController({ options }) {

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

          {/* toggle P values controller */}
          <Col>
            <Form.Group>
              <InputGroup>
                <Form.Check 
                  disabled={options.pvals.disabled} 
                  type="checkbox" 
                  onChange={options.pvals.handler} 
                  label='Mostrar valores P'
                  checked={options.pvals.isChecked}
                />
                {options.pvals.disabled ? 
                <OverlayTrigger placement="bottom" overlay={<Tooltip id="button-tooltip-2">Para obter os valores P é necessário dia de internamento e um parâmetro único diário.</Tooltip>}>
                  <Button style={{marginLeft: '0.3rem'}} variant="outline-dark" className='rounded-circle centered-text-round-button'> i </Button>
                </OverlayTrigger>
                : <></> }
              </InputGroup>
            </Form.Group>
          </Col>

        </Row>
      </Container>
  )
}
