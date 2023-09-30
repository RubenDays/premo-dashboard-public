import { useState, useEffect } from 'react';
import { Row, Container  } from 'react-bootstrap';
import MyPlot from '../MyPlot';
import { getDefaultConfig, getDefaultLayout } from '../plotDefaults';


const MAX_NUM_COLS = 3

export default function ScatterLinePlotly({ dataState }) {
    const [chartState, setChartState] = useState({
        chartData: {
            data: [],
            layout: getDefaultLayout(),
            config: getDefaultConfig(),
        }
    })

    useEffect(() => {
        const newState = { ...chartState }

        let graphs = []

        dataState.graphs_data.forEach(graph => {
            let lines = []
            graph.lines_data.forEach(line => {
                lines.push({
                    type: 'scattergl',
                    x: line.x,
                    y: line.y,
                    mode: 'lines+markers',
                    name: line.line_title,
                })
            })
            graphs.push(lines)
        })

        newState.chartData.data = graphs
        newState.chartData.layout = generateLayout()

        setChartState(newState)

    }, [dataState])

    function generateLayout() {
        // set the layout of the plot
        let layout = { ...chartState.chartData.layout }
        layout.title = `Evolução do nível de ${dataState.param.analysisName} | ${dataState.param.paramName} ${dataState.param.units ? dataState.param.units + ' ' : ''}por paciente`
        layout.xaxis.title.text = 'Tempo em dias, desde a adminssão na UCI'
        layout.yaxis.title.text = `${dataState.param.paramName} ${dataState.param.units ? dataState.param.units : ''}`

        return layout
    }

    return (
        <Container>

            {/* ScatterPlot Chart */}
            <Row style={{marginTop: '1rem'}}>
                <MyPlot 
                    data={chartState.chartData.data.flat()}
                    layout={{...chartState.chartData.layout}}
                    config={chartState.chartData.config} 
                />
            </Row>

        </Container>
    )
}
