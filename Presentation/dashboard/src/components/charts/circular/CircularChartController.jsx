import { Row, Col, Container } from 'react-bootstrap';
import { SelectWaveController, SeparateWavesController } from '../../../utils/controllers/controllerComponents';


export default function CircularChartController({ options }) {

    return (
        <Container>
            <Row>

                {/* select wave controller */}
                <Col>
                    <SelectWaveController 
                        value={options.waves.value}
                        handler={options.waves.handler}
                        options={options.waves.options}
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
