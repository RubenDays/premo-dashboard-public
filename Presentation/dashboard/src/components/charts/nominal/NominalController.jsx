import { Form, Row, Col, Container } from 'react-bootstrap';
import { SelectWaveController, SeparateWavesController } from '../../../utils/controllers/controllerComponents';
import SelectCheckBox from '../../SelectCheckBox';

export default function NominalController({ options }) {

    return (
        <Container>
            <Row>

                {/* choose nominal graph type controller */}
                <Col>
                    <Form.Group style={{width: '200px', marginBottom: '0.5rem'}}>
                        <SelectCheckBox
                            className={undefined}
                            value={options.chart.value}
                            maxSelected={1}
                            isMulti={false}
                            selectAll={undefined}
                            onChangeHandler={options.chart.handler}
                            options={options.chart.options} 
                            placeholder={undefined} />
                    </Form.Group>
                </Col>

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