import { Col, Container, Row } from "react-bootstrap";
import { SelectWaveController, SeparateWavesController } from "../../../utils/controllers/controllerComponents";


export default function ScatterLineAggrController({ options }) {

    return (
        <Container>
            <Row>

                {/* Select wave Controller */}
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