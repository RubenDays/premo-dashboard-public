import { useState, useEffect } from 'react';
import { Row, Container } from 'react-bootstrap';
import BoxPlotController from "./BoxPlotController";
import mannwhitneyu from '../../../utils/mannwhitneyu'
import { generateNumSamplesAnnotation, generateLayout } from '../../../utils/funcs';
import { getDefaultConfig, getDefaultLayout } from '../plotDefaults';
import MyPlot from '../MyPlot';
import { useTranslation, getI18n } from 'react-i18next';


const kruskalTest = require('@stdlib/stats-kruskal-test');

const DEFAULT_COLORS = ['rgb(31, 119, 180)', 'rgb(255, 127, 14)',
                       'rgb(44, 160, 44)', 'rgb(214, 39, 40)',
                       'rgb(148, 103, 189)', 'rgb(140, 86, 75)',
                       'rgb(227, 119, 194)', 'rgb(127, 127, 127)',
                       'rgb(188, 189, 34)', 'rgb(23, 190, 207)']

const MAX_NUM_COLS = 3


export default function BoxPlot({ dataState }) {
    const { t } = useTranslation()

    const [chartState, setChartState] = useState({
        chartData: {
            data: [],
            layout: getDefaultLayout(),
            config: getDefaultConfig(),
        },
        controllers: {
            showPValues: false,
            selectedWave: [],
            separateWaves: false,
        },
        labels: {
            subtitles: []
        }
    })

    const [hiddenBps, setHiddenBps] = useState({ 
        singleClickId: undefined,
        hidden: { }
    })

    useEffect(() => {
        let graphs = []
        const selectedWave = chartState.controllers.selectedWave
        if (selectedWave.length > 0) {
            const selectedData = selectedWave.length === 0 ? dataState.data : [dataState.data[selectedWave[0].value]]
            graphs = createJoinedWavexBps(selectedData, dataState.labels.xTicks)
        } else if (chartState.controllers.separateWaves) {
            graphs = createSeparatePlots(dataState.data, dataState.labels.xTicks)
        } else {
            graphs = createJoinedWavexBps(dataState.data, dataState.labels.xTicks)
        }

        const newState = { ...chartState }
        newState.labels.subtitles = dataState.data.map(elem => { return `${t("graphs.labels.wave")} ${elem.subtitle}`})
        
        // set the layout of the plot
        const layout = internalGenerateLayout(graphs, selectedWave, chartState.controllers.separateWaves)

        newState.chartData.data = graphs
        newState.chartData.layout = layout

        if (chartState.controllers.showPValues) {
            if (!dataState.disabledPVals) {
                drawSignificance(newState, graphs)
            } else {
                chartState.controllers.showPValues = false
                clearSignificance(newState)
            }
        } else {
            clearSignificance(newState)
        }

        setChartState(newState)

    }, [dataState, getI18n().language])

    function internalGenerateLayout(graphs, selectedWave, separateWaves) {
        let layout = generateLayout(
            chartState.chartData.layout,
            graphs,
            chartState.labels.subtitles,
            '',//dataState.labels.xText,
            `${dataState.labels.paramName} ${dataState.labels.units ? dataState.labels.units : ''}`,
            MAX_NUM_COLS
        )

        layout.title = generateTitle(dataState.labels, selectedWave, separateWaves, t)

        const numSamplesAnnots = generateNumSamplesAnnotation(graphs.flat(), layout.grid.rows, true)
        layout.annotations = layout.annotations.concat(numSamplesAnnots)

        return layout
    }

    function togglePValues(ev) {
        let newState = { ...chartState }
        newState.controllers.showPValues = !newState.controllers.showPValues

        if (newState.controllers.showPValues) {
            drawSignificance(newState, newState.chartData.data)
        } else {
            clearSignificance(newState)
        }

        setChartState(newState)
    }

    function drawSignificance(newState, graphs) {
        console.log(hiddenBps)
        const significance = createSignificanceLines(graphs, newState.chartData.layout.grid.rows, hiddenBps)
        newState.chartData.layout.shapes = significance.shapes
        newState.chartData.layout.annotations = newState.chartData.layout.annotations.concat(significance.annotations)
    }

    function clearSignificance(newState) {
        newState.chartData.layout.shapes = []
        newState.chartData.layout.annotations = newState.chartData.layout.annotations.filter(e => e.annot_name !== 'pvalue')
    }

    function selectWaveHandler(values) {
        let newState = { ...chartState }
        newState.controllers.selectedWave = values

        if (values.length === 0) {
            newState.chartData.data = createJoinedWavexBps(dataState.data, dataState.labels.xTicks)
        } else {
            newState.chartData.data = createJoinedWavexBps([dataState.data[values[0].value]], dataState.labels.xTicks)
        }

        // generate the num samples labels for the new dataset
        newState.chartData.layout = internalGenerateLayout(newState.chartData.data, values, false)

        // recalculate signficance bars, in case the checkbox is selected
        if (newState.controllers.showPValues) {
            drawSignificance(newState, newState.chartData.data)
        } else {
            clearSignificance(newState)
        }

        newState.controllers.separateWaves = false

        return setChartState(newState)
    }

    function toggleSeparateWaves(ev) {
        let newState = { ...chartState }
        newState.controllers.separateWaves = !newState.controllers.separateWaves

        let graphs = []
         if (newState.controllers.separateWaves) {
            graphs = createSeparatePlots(dataState.data, dataState.labels.xTicks)
        } else {
            graphs = createJoinedWavexBps(dataState.data, dataState.labels.xTicks)
        }

        newState.chartData.layout = internalGenerateLayout(graphs, [], newState.controllers.separateWaves)
        newState.chartData.data = graphs

        if (newState.controllers.showPValues) {
            drawSignificance(newState, graphs)
        } else {
            clearSignificance(newState)
        }

        newState.controllers.selectedWave = []

        setChartState(newState)
    }

    function onLegendClick(evData) {
        // means it's a double click. cancel the timeout
        let newHiddenBps = { ...hiddenBps }
        if (newHiddenBps.singleClickId) {
            clearInterval(newHiddenBps.singleClickId)
            newHiddenBps.singleClickId = undefined
        } else {
            // if it's not a double click, set a timeout for the duration of the delay of the double click
            newHiddenBps.singleClickId = setTimeout((idx) => {
                let newHBps = { ...hiddenBps }
                if (newHBps.hidden[idx]) {
                    newHBps.hidden[idx] = false
                } else {
                    newHBps.hidden[idx] = true
                }
                newHBps.singleClickId = undefined
                setHiddenBps(newHBps)
            }, 300 /* default double click delay in ms*/, evData.data[evData.curveNumber].groupIdx)
        }

        setHiddenBps(hiddenBps)        
    }

    function onLegendDoubleClick(evData) {
        console.log(evData)
        
        let newHiddenBps = { ...hiddenBps }
        const clickedIdx = evData.data[evData.curveNumber].groupIdx

        // if clicked is already hidden, then show everything
        let hiddenIdxs = Object.keys(newHiddenBps.hidden)
        console.log(hiddenIdxs)
        if (newHiddenBps.hidden[clickedIdx]) {
            console.log('first')
            hiddenIdxs.forEach(elem => {
                newHiddenBps.hidden[elem] = false
            })
        // if all are hidden, except for the clicked one, then show everything
        } else if (areAllHidden(clickedIdx)) {
            console.log('second')
            hiddenIdxs.forEach(elem => {
                newHiddenBps.hidden[elem] = false
            })
        // if clicked one is visible and at least 1 other is visible, show only the clicked one 
        } else {
            console.log('third')
            // have to iterate over all values, because the index might not be stored in hidden yet
            const rawData = chartState.chartData.data.flat()
            chartState.chartData.data[0].forEach((elem, idx) => {
                // if it's a valid bp and is not the one clicked
                const groupData = rawData.filter(d => d.groupIdx === idx && d.y.length > 0)
                if (groupData.length > 0)
                    if (idx !== clickedIdx) {
                        newHiddenBps.hidden[idx] = true
                    }
            })
        }

        function areAllHidden(except) {
            const groupSize = chartState.chartData.data[0].length
            const rawData = chartState.chartData.data.flat()
            for (let idx = 0; idx < groupSize; idx++) {
                // ignore if it's the same as except                
                if (idx !== except) {
                    // get all bps from the same group that have values
                    const groupData = rawData.filter(d => d.groupIdx === idx && d.y.length > 0)
                    // if there's at least one, then check if it's visible
                    if (groupData.length > 0) {
                        if (!newHiddenBps.hidden[idx]) {
                            return false
                        }
                    }
                }
            }

            return true
        }

        setHiddenBps(newHiddenBps)
    }
    
    return (
        <Container>

            {/* Boxplot Controller*/}
            <Row>
                <BoxPlotController
                    options={{
                        pvals: { 
                            handler: togglePValues,
                            disabled: dataState.disabledPVals,
                            isChecked: chartState.controllers.showPValues
                        },
                        separateWaves: { 
                            handler: toggleSeparateWaves,
                            isChecked: chartState.controllers.separateWaves
                        },
                        waves: { 
                            handler: selectWaveHandler,
                            options: dataState.data.map((elem, idx) => { return { label: `${t("graphs.labels.wave")} ${elem.subtitle}`, value: idx }}),
                            value: chartState.controllers.selectedWave
                        }
                    }}
                />        
            </Row>

            {/* Boxplot Chart */}
            <Row style={{marginTop: '1rem'}}>
                <MyPlot 
                    data={chartState.chartData.data.flat()}
                    layout={{... chartState.chartData.layout}}
                    config={chartState.chartData.config}
                    onLegendClick={onLegendClick}
                    onLegendDoubleClick={onLegendDoubleClick}
                />
            </Row>

        </Container>
    )
}

function createSignificanceLines(graphs, rows, hiddenBps) {
    const shapes = []
    const annotations = []

    graphs.forEach(graph => {
        let max = undefined
        let min = undefined
        
        // first step: find min and max value in plot to calculate delta
        graph.forEach(bp => {
            let tmpMax = Math.max(...bp.y)
            let tmpMin = Math.min(...bp.y)
            if (max === undefined || max < tmpMax) {
                max = tmpMax
            }
            if (min === undefined || min > tmpMin) {
                min = tmpMin
            }
        })

        // boxplots shown (those that have values)
        const validBps = graph.filter(e => e.y.length > 0)
        let currentMax = max
        // create the signficance bars
        for (let i = 0; i < validBps.length - 1; i++) {
            for (let j = i + 1; j < validBps.length; j++) {
                const delta = max - min                
                const lowVertLine = currentMax + (delta * 0.04)
                const highVertLine = currentMax + (delta * 0.05)

                const startX = j-i-1
                const endX = j

                // if any of the 2 bps are hidden, skip the construction of their significance line and p value calculation
                if (hiddenBps.hidden[validBps[startX].groupIdx] ||  hiddenBps.hidden[validBps[endX].groupIdx]) {
                    continue
                }

                currentMax = highVertLine

                // this defines in which graph to draw
                const xAxis = validBps[startX].xaxis // the same for the start and end, since they are in the same graph
                const yAxis = validBps[startX].yaxis

                // create the significance lines
                // left vertical line
                shapes.push({
                    type: 'rect',
                    xref: xAxis,
                    yref: yAxis,
                    x0: validBps[startX].name,
                    x1: validBps[startX].name,
                    y0: lowVertLine,
                    y1: highVertLine
                })
                // horizontal line
                shapes.push({
                    type: 'rect',
                    xref: xAxis,
                    yref: yAxis,
                    x0: validBps[startX].name,
                    x1: validBps[endX].name,
                    y0: highVertLine,
                    y1: highVertLine
                })
                // right vertical line
                shapes.push({
                    type: 'rect',
                    xref: xAxis,
                    yref: yAxis,
                    x0: validBps[endX].name,
                    x1: validBps[endX].name,
                    y0: lowVertLine,
                    y1: highVertLine
                })

                // calculate p_value and generate the text on graph 
                const out = mannwhitneyu.test(validBps[startX].y, validBps[endX].y) 

                const p_display = pDisplayString(out.p)

                const y_text = highVertLine + (delta * 0.04)
                currentMax = y_text

                const p_annotation = {
                    x: startX + ((endX - startX) / 2),
                    y: y_text,
                    text: p_display,
                    annot_name: 'pvalue',
                    xref: xAxis,
                    yref: yAxis,
                    showarrow: false
                }

                annotations.push(p_annotation)
            }

        }

        // calculate Kruskal pValue and creates its annotation if there's more than 2 groups
        if (validBps.length > 2) {
            // calculate kruskal p_value
            const kruskal = kruskalTest(...validBps.map(validBp => validBp.y))
            const pValue = pDisplayString(kruskal.pValue)
            // create krusal annotation
            const kruskal_annot = {
                x: 0.03,
                y: 1 + (0.05 * rows),
                annot_name: 'pvalue',
                text: `Kruskal-Wallis, p = ${pValue}`,
                xref: `${validBps[0].xaxis} domain`,
                yref: `${validBps[0].yaxis} domain`,
                showarrow: false
            }
            annotations.push(kruskal_annot)
        }

    })

    return { shapes, annotations }
}

function pDisplayString(p) {
    return p < 0.001 ? p.toExponential(3) : p.toFixed(3)
}

function createSeparatePlots(data, xTicks) {
    let graphs = []
    let legends = {}
    data.forEach((graph, graphIdx) => {
        let bps = []
        const row = graphIdx + 1
        graph.values.forEach((vals, bpIdx) => {

            // set the legends for the subplots
            let showLegend = false
            // only if it hasn't been set and there's actual values
            if (legends[bpIdx] === undefined && vals.length != 0) {
                legends[bpIdx] = true
                showLegend = true
            }
            // create the boxplot
            bps.push({
                groupIdx: bpIdx,
                row: row,
                type: 'box',
                y: vals,
                boxpoints: 'Outliers',
                boxmean: 'sd',
                name: xTicks[bpIdx],
                xaxis: `x${graphIdx+1}`,
                yaxis: `y${graphIdx+1}`,
                legendgroup: xTicks[bpIdx],
                showlegend: showLegend,
                marker: { color: DEFAULT_COLORS[bpIdx % DEFAULT_COLORS.length] } // makes it so that every boxplot of the same label have the same colour
            })
        })

        graphs.push(bps)
    })

    return graphs
}

function createJoinedWavexBps(data, xTicks) {
    if (!data || data.length === 0) return []

    let joinedData = []
    // initiate objects for the boxplots
    data[0].values.forEach((e, idx) => joinedData.push({
        groupIdx: idx,
        type: 'box',
        y: [],
        boxpoints: 'Outliers',
        boxmean: 'sd',
        xaxis: 'x',
        yaxis: 'y',
    }))

    // group the different waves together
    data.forEach(ds => {
        ds.values.forEach((elems, idx) => {
            joinedData[idx].y = joinedData[idx].y.concat(elems)
        })
    })

     // set the xTicks values (demography if exists)
    xTicks.forEach((xTick, idx) => {
        joinedData[idx].name = xTick
    })

    return [joinedData]
}

function generateTitle(labels, selectedWave, separateWaves, t) {
    let prefix = ''
    const analysis = labels.analysisName ? labels.analysisName + ' |' : ''
    const units = labels.units ? ' ' + labels.units : ''
    if (labels.xText) {
        prefix = t("graphs.boxplot.titles.prefix2", { analysis: analysis, param: labels.paramName, units: units, demo: labels.xText })
    } else {
        prefix = t("graphs.boxplot.titles.prefix1", { analysis: analysis, param: labels.paramName, units: units })
    }
    if (selectedWave.length === 0) {
        if (separateWaves) {
            return `${prefix} ${t("graphs.boxplot.titles.suffix1")}`
        }
        return `${prefix} ${t("graphs.boxplot.titles.suffix2")}`
    }
    
    return `${prefix} ${t("graphs.boxplot.titles.suffix3", { wave: selectedWave[0].label })}`
}
