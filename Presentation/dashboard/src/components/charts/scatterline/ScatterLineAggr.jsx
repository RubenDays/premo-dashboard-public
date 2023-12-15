import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Row, Container, Form, Col, InputGroup  } from 'react-bootstrap';
import { calculateRowsCols, generateLayout, generateNumSamplesAnnotation } from '../../../utils/funcs';
import ScatterLineAggrController from './ScatterLineAggrController';
import { DEFAULT_CONFIG, DEFAULT_LAYOUT, getDefaultConfig, getDefaultLayout } from '../plotDefaults';
import MyPlot from '../MyPlot';
import { useTranslation, getI18n } from 'react-i18next';


const MAX_NUM_COLS = 3

export default function ScatterLineAggr({ dataState }) {
    const { t } = useTranslation()

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
        },
        labels: {
            subtitles: []
        }
    })

    useEffect(() => {
        const newState = { ...chartState }

        newState.labels.subtitles = dataState.waves_graphs.map(elem => { return `${t("graphs.labels.wave")} ${elem.subtitle}`})

        let graphs = []
        const selectedWave = chartState.controllers.selectedWave
        if (selectedWave.length > 0) {
            graphs = createSingleGraph(dataState.waves_graphs[selectedWave[0].value])
        } else if (chartState.controllers.separateWaves) {
            graphs = createSeparatedGraphs(newState.labels.subtitles, dataState.waves_graphs)
        } else {
            graphs = createSingleGraph(dataState.all_graph)
        }

        newState.chartData.data = graphs
        newState.chartData.layout = internalGenerateLayout(graphs, selectedWave, chartState.controllers.separateWaves)

        setChartState(newState)

    }, [dataState, getI18n().language])

    function internalGenerateLayout(graphs, selectedWave, separateWaves) {
        let layout = generateLayout(
            chartState.chartData.layout,
            graphs,
            chartState.labels.subtitles,
            t("graphs.scatter-lines-aggr.xtitle"),
            `${dataState.label.param_name} ${dataState.label.units ? dataState.label.units : ''}`,
            MAX_NUM_COLS
        )

        layout.title = generateTitle(dataState.label, selectedWave, separateWaves, t)

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
            graphs = createSeparatedGraphs(newState.labels.subtitles, dataState.waves_graphs)
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
                            options: dataState.waves_graphs.map((elem, idx) => { return { label: `${t("graphs.labels.wave")} ${elem.subtitle}`, value: idx }}),
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

function generateTitle(label, selectedWave, separateWaves, t) {
    let prefix = ''
    if (label.analysis_name) {
        prefix = `${t("graphs.scatter-lines-aggr.titles.prefix2", { analysis: label.analysis_name, param: label.param_name })}${label.units ? ' ' + label.units : ''}`
    } else {
        prefix = `${t("graphs.scatter-lines-aggr.titles.prefix1", { param: label.param_name })}${label.units ? ' ' + label.units : ''}`
    }

    if (selectedWave.length > 0) {
        return `${prefix} ${t("graphs.scatter-lines-aggr.titles.suffix1", { wave: selectedWave[0].label})}`
    } else if (separateWaves) {
        return `${prefix} ${t("graphs.scatter-lines-aggr.titles.suffix2")}`
    } else {
        return `${prefix} ${t("graphs.scatter-lines-aggr.titles.suffix3")}`
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

function createSeparatedGraphs(subtitles, wavesGraphs) {
    let graphs = []

    wavesGraphs.forEach((graph, idx) => {
        graphs.push([{
            showlegend: false,
            name: subtitles[idx],
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