import { useOutletContext } from 'react-router-dom';
import { Container, Row, Col, Card } from "react-bootstrap";
import Plot from 'react-plotly.js';
import { getDefaultConfig, getDefaultLayout } from "../charts/plotDefaults";


const PLOT_WIDTH = 600
const PLOT_HEIGHT = 470

export default function Dashboard() {
    const [ctx, setCtx] = useOutletContext()

    function createPatientWavesPlot() {

        let values = []
        let labels = []
        ctx.data.init_data.num_patients_waves.forEach(elem => {
            values.push(elem.num_patients)
            labels.push(elem.wave)
        });

        let data = [{
            y: values,
            x: labels,
            type: 'bar',
            text: values.map(String),
            marker: {
                opacity: 0.8,
            }
        }]

        const layout = getDefaultLayout()
        layout.title = '# pacientes por vaga'
        layout.width = PLOT_WIDTH
        layout.height = PLOT_HEIGHT

        return <Plot
            data={data}
            layout={layout}
            config={getDefaultConfig()}
        />
    }

    function createTriagesWavesPlot() {
        let values = []
        let labels = []
        ctx.data.init_data.num_triages_waves.forEach(elem => {
            values.push(elem.num_triages)
            labels.push(elem.wave)
        });

        let data = [{
            y: values,
            x: labels,
            type: 'bar',
            text: values.map(String),
            marker: {
                opacity: 0.8,
            }
        }]

        const layout = getDefaultLayout()
        layout.title = '# colheitas por vaga'
        layout.width = PLOT_WIDTH
        layout.height = PLOT_HEIGHT

        return <Plot
            data={data}
            layout={layout}
            config={getDefaultConfig()}
        />
    }

    return (
        <Container>
            <Row> <h2> Vista geral </h2> </Row>

            <Row>
                <Col className='init-card'>
                    <Card border='dark'>
                        <Card.Body>
                            <Card.Title> # Pacientes </Card.Title>
                            <Card.Text> {ctx.data.init_data.num_patients} </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                <Col className='init-card'>
                    <Card border='dark'>
                        <Card.Body>
                            <Card.Title> # Colheitas </Card.Title>
                            <Card.Text> {ctx.data.init_data.num_triages} </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                <Col className='init-card'>
                    <Card border='dark'>
                        <Card.Body>
                            <Card.Title> # Vagas </Card.Title>
                            <Card.Text> {ctx.data.init_data.num_waves} </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row style={{marginTop: '1rem'}}>
                <Col> {createPatientWavesPlot()} </Col>
                <Col> {createTriagesWavesPlot()} </Col>
            </Row>
        </Container>
    )
}