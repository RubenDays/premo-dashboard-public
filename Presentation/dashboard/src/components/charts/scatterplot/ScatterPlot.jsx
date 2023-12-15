import { useState, useEffect } from 'react';
import { Row, Container  } from 'react-bootstrap';
import ScatterPlotController from './ScatterPlotController';
import { generateLayout, generateNumSamplesAnnotation, generateTestValueAnnotation, testValueDisplayString } from '../../../utils/funcs';
import Statistics from 'statistics.js'
import { getDefaultConfig, getDefaultLayout } from '../plotDefaults';
import MyPlot from '../MyPlot';
import { useTranslation, getI18n } from 'react-i18next';
import quantile from 'compute-quantile'


const MAX_NUM_COLS = 3

export default function ScatterPlot({ dataState }) {
    const { t } = useTranslation()

    const [chartState, setChartState] = useState({
        chartData: {
            data: [],
            layout: getDefaultLayout(),
            config: getDefaultConfig()
        },
        controllers: {
            separateWaves: false,
            selectedWave: [],
            invertedAxis: false,
            hideOutliers: false
        },
        internalData: {
            pValues: []
        },
        labels: {
            subtitles: []
        }
    })

    useEffect(() => {
        let graphs = []
        const selectedWave = chartState.controllers.selectedWave

        let newState = { ...chartState }
        newState.labels.subtitles = dataState.waves_graphs.map(elem => { return `${t("graphs.labels.wave")} ${elem.subtitle}`})

        if (selectedWave.length > 0) {
            const v = selectedWave[0].value
            graphs = joinAllWaves([dataState.waves_graphs[v]], v + 1)
        } else if (chartState.controllers.separateWaves) {
            graphs = separateWaves(dataState.waves_graphs, newState.labels.subtitles)
        } else {
            graphs = joinAllWaves(dataState.waves_graphs, 0)
        }

        
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

        //const pValues = generatePValues(all_graphs)
        // save the pValues in state so it won't be required to recalculate with the same data
        
        const pValues = generatePValues(graphs)
        
        newState.internalData.pValues = pValues

        newState.chartData.layout = internalGenerateLayout(graphs, selectedWave, newState.controllers.separateWaves)

        setChartState(newState)

    }, [dataState, getI18n().language])

    function toggleSeparateWaves() {
        let newState = { ...chartState }
        newState.controllers.separateWaves = !newState.controllers.separateWaves

        let graphs = []
        if (newState.controllers.separateWaves) {
            graphs = separateWaves(dataState.waves_graphs, newState.labels.subtitles)
        } else {
            graphs = joinAllWaves(dataState.waves_graphs, 0)
        }

        newState.controllers.selectedWave = []
        newState.chartData.data = graphs

        if (newState.controllers.hideOutliers) {
            newState = hideOutliers(newState)
        }

        newState.chartData.layout = internalGenerateLayout(graphs, [], newState.controllers.separateWaves)

        setChartState(newState)
    }

    function toggleOutliers(ev) {
        let newState = { ...chartState }
        newState.controllers.hideOutliers = !newState.controllers.hideOutliers

        if (newState.controllers.hideOutliers) {
            newState = hideOutliers(newState)
        } else {
            newState = showOutliers(newState)
        }

        newState.chartData.layout = internalGenerateLayout(newState.chartData.data, newState.controllers.selectedWave, newState.controllers.separateWaves)

        setChartState(newState)
    }

    function showOutliers(newState) {
        // show outliers
        if (chartState.controllers.selectedWave.length > 0) {
            const v = chartState.controllers.selectedWave[0].value
            let d = newState.chartData.data[0][0]
            d.x = dataState.waves_graphs[v].x
            d.y = dataState.waves_graphs[v].y

            newState.chartData.data[0][0] = d
        } else if (chartState.controllers.separateWaves) {
            newState.chartData.data.forEach((data, idx) => {
                data[0].x = dataState.waves_graphs[idx].x
                data[0].y = dataState.waves_graphs[idx].y
            })

        } else {
            let d = newState.chartData.data[0][0]
            let x = []
            let y = []

            dataState.waves_graphs.forEach(data => {
                x = x.concat(data.x)
                y = y.concat(data.y)
            })

            d.x = x
            d.y = y

            newState.chartData.data[0][0] = d
        }

        return newState
    }

    function hideOutliers(newState) {
        newState.chartData.data.forEach(data => {
            const newX = []
            const newY = []
            const xLimit = getOutlierLimit(data[0].x)
            const yLimit = getOutlierLimit(data[0].y)

            data[0].x.forEach((value, idx) => {
                if (value <= xLimit && data[0].y[idx] <= yLimit) {
                    newX.push(value)
                    newY.push(data[0].y[idx])
                }
            })

            data[0].x = newX
            data[0].y = newY
        })

        return newState        
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

        newState.controllers.separateWaves = false

        if (newState.controllers.hideOutliers) {
            newState = hideOutliers(newState)
        }

        newState.chartData.layout = internalGenerateLayout(newState.chartData.data, values, false)
    
        return setChartState(newState)
    }

    function internalGenerateLayout(graphs, selectedWave, separateWaves) {
        let layout = generateLayout(
            chartState.chartData.layout,
            graphs,
            chartState.labels.subtitles,
            `${dataState.labels.xAxis.param_name} ${dataState.labels.xAxis.units ? dataState.labels.xAxis.units : ''}`,
            `${dataState.labels.yAxis.param_name} ${dataState.labels.yAxis.units ? dataState.labels.yAxis.units : ''}`,
            MAX_NUM_COLS
        )

        layout.title = generateTitle(selectedWave, separateWaves, dataState.labels, t)

        const numSamplesAnnots = generateNumSamplesAnnotation(graphs.flat(), layout.grid.rows)
        layout.annotations = layout.annotations.concat(numSamplesAnnots)

        const pVals = generatePValues(graphs).map(e => { return { r: e.rho, p: e.significanceNormal ? e.significanceNormal.pTwoTailed : undefined }})
        
        // chartState.internalData.pValues.map(e => { return { r: e.rho, p: e.significanceNormal ? e.significanceNormal.pTwoTailed : undefined }})
        const pValueAnnots = generatePValueAnnotations(graphs.flat(), pVals, layout.grid.rows)
        layout.annotations = layout.annotations.concat(pValueAnnots)

        return layout
    }

    console.log(dataState)

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
                            options: dataState.waves_graphs.map((elem, idx) => { return { label: `${t("graphs.labels.wave")} ${elem.subtitle}`, value: idx }}),
                            value: chartState.controllers.selectedWave
                        },
                        outliers: {
                            handler: toggleOutliers,
                            isChecked: chartState.controllers.hideOutliers
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
    console.log(graphs)

    graphs.forEach((graph, idx) => {
        const pValue = pValues[idx]
        const text = `Spearman, r=${testValueDisplayString(pValue.r)}` // <br /> p=${testValueDisplayString(pValue.p)}`
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

function separateWaves(wavesGraphs, subtitles) {
    let graphs = []
    wavesGraphs.forEach((graph, idx) => {
        graphs.push([{
            showlegend: false,
            name: subtitles[idx],
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

function generateTitle(selectedWave, separateWaves, params, t) {
    const prefix = t("graphs.scatter.titles.prefix", {param1: params.xAxis.param_name, param2: params.yAxis.param_name})

    if (selectedWave.length > 0) {
        return `${prefix} ${t("graphs.scatter.titles.suffix3", {wave: selectedWave[0].label })}`
    } else if (separateWaves) {
        return `${prefix} ${t("graphs.scatter.titles.suffix1")}`
    } else {
        return `${prefix} ${t("graphs.scatter.titles.suffix2")}`
    }

}

function generatePValues(graphs) {
    console.log(graphs)
    let testData = []
   /* graphs.forEach(graph => {
        let data = []
        graph.x.forEach((value, idx) => {
            data.push({
                x: value,
                y: graph.y[idx]
            })
        })
        testData.push(data)
    })*/

    graphs.forEach(graph => {
        let data = []
        graph[0].x.forEach((value, idx) => {
            data.push({
                x: value,
                y: graph[0].y[idx]
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

function getOutlierLimit(data) {
    const d = data.map(elem => Number(elem))
    const q1 = Number(quantile(d, 0.25))
    const q3 = Number(quantile(d, 0.75))

    return q3 + 1.5 * (q3 - q1)
}
