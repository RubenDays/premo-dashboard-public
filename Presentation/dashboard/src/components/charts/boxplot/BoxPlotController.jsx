import { Form, InputGroup, Row, Col, Container, OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import { SelectWaveController, SeparateWavesController } from '../../../utils/controllers/controllerComponents';
import { useTranslation } from 'react-i18next';

export default function BoxPlotController({ options }) {
    const { t } = useTranslation()

  return (
      <Container>
        <Row>

          {/* select wave controller */}
          <Col>
              <SelectWaveController
                value={options.waves.value}
                options={options.waves.options}
                handler={options.waves.handler}
              />
          </Col>

          {/* toggle show separated waves controller */}
          <Col>
            <SeparateWavesController
                isChecked={options.separateWaves.isChecked}
                handler={options.separateWaves.handler} 
            />
          </Col>

          {/* toggle P values controller */}
          <Col>
            <Form.Group>
              <InputGroup>
                <Form.Check 
                  disabled={options.pvals.disabled} 
                  type="checkbox" 
                  onChange={options.pvals.handler} 
                  label={t("graphs.boxplot.controller.pvalue.cb")}
                  checked={options.pvals.isChecked}
                />
                {options.pvals.disabled ? 
                <OverlayTrigger placement="bottom" overlay={<Tooltip id="button-tooltip-2"> {t("graphs.boxplot.controller.pvalue.help")} </Tooltip>}>
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
