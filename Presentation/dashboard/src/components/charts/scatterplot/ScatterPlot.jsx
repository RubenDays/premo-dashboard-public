import { useState, useEffect } from 'react';
import { Row, Container  } from 'react-bootstrap';
import ScatterPlotController from './ScatterPlotController';
import { generateLayout, generateNumSamplesAnnotation, generateTestValueAnnotation, testValueDisplayString } from '../../../utils/funcs';
import Statistics from 'statistics.js'
import { getDefaultConfig, getDefaultLayout } from '../plotDefaults';
import MyPlot from '../MyPlot';


const MAX_NUM_COLS = 3

export default function ScatterPlot({ dataState }) {
    const [chartState, setChartState] = useState({
        chartData: {
            data: [],
            layout: getDefaultLayout(),
            config: getDefaultConfig()
        },
        controllers: {
            separateWaves: false,
            selectedWave: [],
            invertedAxis: false
        },
        internalData: {
            pValues: []
        }
    })

    useEffect(() => {
        let graphs = []
        const selectedWave = chartState.controllers.selectedWave
        if (selectedWave.length > 0) {
            const v = selectedWave[0].value
            graphs = joinAllWaves([dataState.waves_graphs[v]], v + 1)
        } else if (chartState.controllers.separateWaves) {
            graphs = separateWaves(dataState.waves_graphs)
        } else {
            graphs = joinAllWaves(dataState.waves_graphs, 0)
        }

        let newState = { ...chartState }
        newState.chartData.data = graphs

        // Calculate pValues for all graphs whenever new data is received
        // create graph for all the waves to calculate pValue
        let all_x = []
        let all_y = []
        dataState.waves_graphs.forEach(graph => {
            all_x = all_x.concat(graph.x)
            all_y = all_y.concat(graph.y)
        });
        let all_graphs = [{x: all_x, y: all_y}]
        all_graphs = all_graphs.concat(dataState.waves_graphs) // create a list with all the graphs. Graph 0 refers to all graph

        const pValues = generatePValues(all_graphs)
        // save the pValues in state so it won't be required to recalculate with the same data
        newState.internalData.pValues = pValues

        newState.chartData.layout = internalGenerateLayout(graphs, selectedWave, newState.controllers.separateWaves)

        setChartState(newState)

    }, [dataState])

    function toggleSeparateWaves() {
        let newState = { ...chartState }
        newState.controllers.separateWaves = !newState.controllers.separateWaves

        let graphs = []
        if (newState.controllers.separateWaves) {
            graphs = separateWaves(dataState.waves_graphs)
        } else {
            graphs = joinAllWaves(dataState.waves_graphs, 0)
        }

        newState.controllers.selectedWave = []
        newState.chartData.data = graphs

        newState.chartData.layout = internalGenerateLayout(graphs, [], newState.controllers.separateWaves)

        setChartState(newState)
    }

    function selectWaveHandler(values) {
        let newState = { ...chartState }
        newState.controllers.selectedWave = values
    
        if (values.length === 0) {
            newState.chartData.data = joinAllWaves(dataState.waves_graphs, 0)
        } else {
            const v = values[0].value
            newState.chartData.data = joinAllWaves([dataState.waves_graphs[v]], v + 1)
        }
    
        newState.chartData.layout = internalGenerateLayout(newState.chartData.data, values, false)
    
        newState.controllers.separateWaves = false
    
        return setChartState(newState)
    }

    function internalGenerateLayout(graphs, selectedWave, separateWaves) {
        let layout = generateLayout(
            chartState.chartData.layout,
            graphs,
            dataState.waves_graphs,
            `${dataState.labels.xAxis.paramName} ${dataState.labels.xAxis.units ? dataState.labels.xAxis.units : ''}`,
            `${dataState.labels.yAxis.paramName} ${dataState.labels.yAxis.units ? dataState.labels.yAxis.units : ''}`,
            MAX_NUM_COLS
        )

        layout.title = generateTitle(selectedWave, separateWaves, dataState.labels)

        const numSamplesAnnots = generateNumSamplesAnnotation(graphs.flat(), layout.grid.rows)
        layout.annotations = layout.annotations.concat(numSamplesAnnots)

        const pVals = chartState.internalData.pValues.map(e => { return { r: e.rho, p: e.significanceNormal.pTwoTailed }})
        const pValueAnnots = generatePValueAnnotations(graphs.flat(), pVals, layout.grid.rows)
        layout.annotations = layout.annotations.concat(pValueAnnots)

        return layout
    }

    return (
        <Container>

            {/* ScatterPlot Controller*/}
            <Row>
                <ScatterPlotController 
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

function generatePValueAnnotations(graphs, pValues, numRows) {
    const annotations = []
    console.log(pValues)

    graphs.forEach(graph => {
        const pValue = pValues[graph.graphIdx]
        const text = `Spearman, r=${testValueDisplayString(pValue.r)} <br /> p=${testValueDisplayString(pValue.p)}`
        const annot = generateTestValueAnnotation(numRows, graph.xaxis, graph.yaxis, text)
        annotations.push(annot)
    })

    return annotations
}

/**
 * Joins all the waves to create a single plot 
 * @param {Array} wavesGraphs 
 * @param {number} graphIdx index of the graph to refer to the existing pValues. 0 is the all graph, 1 is 1st wave, 2 is 2nd wave, etc. 
 * @returns list containing the graphs
 */
function joinAllWaves(wavesGraphs, graphIdx) {
    let x = []
    let y = []
    wavesGraphs.forEach(graph => {
        x = x.concat(graph.x)
        y = y.concat(graph.y)
    });

    return [[{
        type: 'scattergl', // 'scattergl' has way better performance than 'scatter' which uses svg
        x: x,
        y: y,
        mode: 'markers',
        opacity: 0.5,
        xaxis: 'x',
        yaxis: 'y',
        graphIdx: graphIdx
    }]]
}

function separateWaves(wavesGraphs) {
    let graphs = []
    wavesGraphs.forEach((graph, idx) => {
        graphs.push([{
            showlegend: false,
            name: graph.subtitle,
            type: 'scattergl',
            x: graph.x,
            y: graph.y,
            mode: 'markers',
            opacity: 0.5,
            xaxis: `x${idx+1}`,
            yaxis: `y${idx+1}`,
            graphIdx: idx + 1
        }])
    })

    return graphs
}

function generateTitle(selectedWave, separateWaves, params) {
    const prefix = `Relação entre ${params.xAxis.paramName} e ${params.yAxis.paramName}`

    if (selectedWave.length > 0) {
        return `${prefix} para a ${selectedWave[0].label}`
    } else if (separateWaves) {
        return `${prefix} para cada vaga`
    } else {
        return `${prefix} em todas as vagas`
    }

}

function generatePValues(graphs) {
    let testData = []
    graphs.forEach(graph => {
        let data = []
        graph.x.forEach((value, idx) => {
            data.push({
                x: value,
                y: graph.y[idx]
            })
        })
        testData.push(data)
    })

    const testVars = {
        x: 'metric',
        y: 'metric'
    };
    
    const pValues = []
    testData.forEach(data => {
        let dependence = { rho: NaN, pval: NaN }
        if (data.length > 1) {
            const stats = new Statistics(data, testVars);
            dependence = stats.spearmansRho('x', 'y');
        }
        pValues.push(dependence)
    })

    console.log(pValues)

    return pValues
}
