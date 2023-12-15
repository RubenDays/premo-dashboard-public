import { Row, Col, Container } from 'react-bootstrap';
import { SelectWaveController, SeparateWavesController } from '../../../utils/controllers/controllerComponents';

export default function KMPlotController({ options }) {

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

        </Row>
      </Container>
  )
}
