import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Row, Container, Form, Col, InputGroup  } from 'react-bootstrap';
import { calculateRowsCols, generateLayout, generateNumSamplesAnnotation } from '../../../utils/funcs';
import ScatterLineAggrController from './ScatterLineAggrController';
import { DEFAULT_CONFIG, DEFAULT_LAYOUT, getDefaultConfig, getDefaultLayout } from '../plotDefaults';
import MyPlot from '../MyPlot';


const MAX_NUM_COLS = 3

export default function ScatterLineAggr({ dataState }) {

    const [chartState, setChartState] = useState({
        chartData: {
            data: [],
            layout: getDefaultLayout(),
            config: getDefaultConfig(),
            numSamples: []
        },
        controllers: {
            selectedWave: [],
            separateWaves: false
        }
    })

    useEffect(() => {
        const newState = { ...chartState }

        let graphs = []
        const selectedWave = chartState.controllers.selectedWave
        if (selectedWave.length > 0) {
            graphs = createSingleGraph(dataState.waves_graphs[selectedWave[0].value])
        } else if (chartState.controllers.separateWaves) {
            graphs = createSeparatedGraphs(dataState.waves_graphs)
        } else {
            graphs = createSingleGraph(dataState.all_graph)
        }

        newState.chartData.data = graphs
        newState.chartData.layout = internalGenerateLayout(graphs, selectedWave, chartState.controllers.separateWaves)

        setChartState(newState)

    }, [dataState])

    function internalGenerateLayout(graphs, selectedWave, separateWaves) {
        let layout = generateLayout(
            chartState.chartData.layout,
            graphs,
            dataState.waves_graphs,
            'Tempo em dias, desde a adminssão na UCI',
            `${dataState.label.paramName} ${dataState.label.units ? dataState.label.units : ''}`,
            MAX_NUM_COLS
        )

        layout.title = generateTitle(dataState.label, selectedWave, separateWaves)

        const numSamplesAnnots = generateNumSamplesAnnotation(graphs.flat(), layout.grid.rows)
        layout.annotations = layout.annotations.concat(numSamplesAnnots)

        return layout
    }

    function selectWaveHandler(values) {
        let newState = { ...chartState }
        newState.controllers.separateWaves = false
        newState.controllers.selectedWave = values

        let graphs = []
        if (values.length > 0) {
            graphs = createSingleGraph(dataState.waves_graphs[values[0].value])
        } else {
            graphs = createSingleGraph(dataState.all_graph)
        }

        newState.chartData.data = graphs
        newState.chartData.layout = internalGenerateLayout(graphs, values, false)

        setChartState(newState)
    }

    function toggleSeparateWaves() {
        let newState = { ...chartState }
        newState.controllers.separateWaves = !newState.controllers.separateWaves
        newState.controllers.selectedWave = []

        let graphs = []
        if (newState.controllers.separateWaves) {
            graphs = createSeparatedGraphs(dataState.waves_graphs)
        } else {
            graphs = createSingleGraph(dataState.all_graph)
        }

        newState.chartData.data = graphs
        newState.chartData.layout = internalGenerateLayout(graphs, [], newState.controllers.separateWaves)

        setChartState(newState)
    }

    return (
        <Container>

            <Row>
                <ScatterLineAggrController 
                    options={{
                        separateWaves: { 
                            handler: toggleSeparateWaves,
                            isChecked: chartState.controllers.separateWaves
                        },
                        waves: { 
                            handler: selectWaveHandler,
                            options: dataState.waves_graphs.map((elem, idx) => { return { label: elem.subtitle, value: idx }}),
                            value: chartState.controllers.selectedWave
                        }
                    }} 
                />
            </Row>

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

function generateTitle(label, selectedWave, separateWaves) {
    const suffix = `Evolução de ${label.analysisName} | ${label.paramName} ${label.units ? label.units : ''}`
    if (selectedWave.length > 0) {
        return `${suffix} para a ${selectedWave[0].label}`
    } else if (separateWaves) {
        return `${suffix} para cada vaga`
    } else {
        return `${suffix} para todas as vagas`
    }
}

function createSingleGraph(graph) {
    return [[{
        type: 'scattergl',
        x: graph.x,
        y: graph.y,
        mode: 'lines+markers',
        xaxis: `x`,
        yaxis: `y`,
    }]]
}

function createSeparatedGraphs(wavesGraphs) {
    let graphs = []

    wavesGraphs.forEach((graph, idx) => {
        graphs.push([{
            showlegend: false,
            name: graph.subtitle,
            type: 'scattergl',
            x: graph.x,
            y: graph.y,
            mode: 'lines+markers',
            xaxis: `x${idx+1}`,
            yaxis: `y${idx+1}`,
        }])
    })

    return graphs
}