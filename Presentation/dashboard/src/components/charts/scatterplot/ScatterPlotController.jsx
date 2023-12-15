import { Container, Row, Col, InputGroup, Form } from "react-bootstrap";
import { SelectWaveController, SeparateWavesController } from "../../../utils/controllers/controllerComponents";
import { useTranslation, getI18n } from 'react-i18next';


export default function ScatterPlotController({ options }) {
    const { t } = useTranslation()

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

                <Col>
                    <Form.Group>
                        <InputGroup>
                            <Form.Check
                            disabled={false} 
                            type="checkbox" 
                            onChange={options.outliers.handler} 
                            label={t("graphs.boxplot.controller.outliers.cb")}
                            checked={options.outliers.isChecked}
                            />
                        </InputGroup>
                    </Form.Group>
                </Col>

            </Row>
        </Container>
    )
}