import React, { useEffect, useState } from 'react';
import { Row, Container  } from 'react-bootstrap';
import { calculateRowsCols } from '../../../utils/funcs';
import { getDefaultConfig, getDefaultLayout } from '../plotDefaults';
import MyPlot from '../MyPlot';
import { useTranslation, getI18n } from 'react-i18next';

const MAX_NUM_COLS = 3

export default function CircularChart({ dataState, controllers }) {
    const { t } = useTranslation()
    const [chartState, setChartState] = useState({
        chartData: {
            data: [],
            layout: getDefaultLayout(),
            config: getDefaultConfig(),
        }
    })

    useEffect(() => {
        let graphs = []

        if (controllers.separateWaves) {
            const subtitles = dataState.data.map(elem => { return `${t("graphs.labels.wave")} ${elem.subtitle}`})
            graphs = separateWaves(subtitles, dataState.data, dataState.labels)
        } else if (controllers.selectedWave.length === 0) {
            graphs = joinAllWaves(dataState.data, dataState.labels)
        } else {
            const selWave = controllers.selectedWave[0]
            graphs = joinAllWaves([dataState.data[selWave.value]], dataState.labels)
        }

        const newState = { ...chartState }

        newState.chartData.data = graphs

        newState.chartData.layout = generateLayout(graphs, controllers.selectedWave)

        setChartState(newState)
    }, [dataState, controllers, getI18n().language])

    function generateLayout(graphs, selectedWave) {
        // set the layout of the plot
        let layout = {... chartState.chartData.layout }
        layout.title = getTitle(selectedWave)

        const grid_size = calculateRowsCols(graphs.length, MAX_NUM_COLS)
        layout.grid = grid_size

        layout.annotations = []

        // only relevant to have a subtitle if there's more than 1 graph
        // TODO: subplots titles
        /*
        if (graphs.length > 1) {
            // make subplots' titles
            let xPerGraph =  1 / grid_size.columns
            let yPerGraph = 1 / grid_size.rows        
            let startY = 0
            let lastRow = 0
            graphs.forEach((graph, idx) => {
                if (lastRow !== graph.domain.row) {
                startY += yPerGraph
                }

                const startX = xPerGraph * (graph.domain.column) - (0.15 + (0.001 * (grid_size.columns - graph.domain.column)))
                const x1 = startX + xPerGraph
                const y1 = yPerGraph * (graph.domain.row + 1)
                layout.annotations.push({
                    text: dataState.data[idx].title,
                    annot_name: 'subtitle',
                    font: { size: 15, color: 'black' },
                    showarrow: false,
                    x: ((startX + x1) / 2),
                    y: 1 - ((startY + y1) / 2) - (0.05 * (graph.domain.row+1)),
                    xanchor: 'center',
                    yanchor: 'middle',
                })
                
                lastRow = graph.domain.row
            })
        }
        */

        return layout
    }

    function getTitle(selectedWave) {
        const prefix = t("graphs.nominal.titles.prefix", {demo: dataState.demography})

        if (selectedWave.length === 0) {
            if (controllers.separateWaves) {
                return `${prefix} ${t("graphs.nominal.titles.suffix1")}`
            }
            return `${prefix} ${t("graphs.nominal.titles.suffix2")}`
        }

        return `${prefix} ${t("graphs.nominal.titles.suffix3", { wave: selectedWave[0].label })}`
    }

    return (
        <Container>

            {/* Circular Chart */}
            <Row style={{marginTop: '1rem'}}>
                <MyPlot 
                    data={chartState.chartData.data}
                    layout={{...chartState.chartData.layout}}
                    config={chartState.chartData.config} 
                    />
            </Row>

        </Container>
    )
}

function joinAllWaves(graphs, labels) {
    if (!graphs || graphs.length === 0) return []

    // initiate the array with 0s
    let joinedData = Array(graphs[0].values.length).fill(0)

    // group the different waves together
    graphs.forEach(graph => {
        graph.values.forEach((value, idx) => {
            joinedData[idx] += value
        })
    })

    return [{
        values: joinedData,
        labels: labels,
        type: 'pie',
        automargin: true,
        outsidetextfont: { color: 'transparent' }
    }]

}

function separateWaves(subtitles, data, labels) {
    let graphs = []
    let row = 0
    let col = 0
    data.forEach((graph, idx) => {
        graphs.push({
            values: graph.values,
            labels: labels,
            type: 'pie',
            name: subtitles[idx],
            domain: {
                row: row,
                column: col
            },
            //textinfo: 'none',
            outsidetextfont: { color: 'transparent' },
            xaxis: `x${idx}`,
            yaxis: `y${idx}`
        })

        col += 1
        // new row
        if (col > MAX_NUM_COLS - 1) {
            col = 0
            row += 1
        }
    })

    return graphs
}


function createChart(data, labels, isCircular) {
    if (isCircular) {
        return {
            values: data,
            labels: labels,
        }
    }

    return {
        x: labels,
        y: data
    }

}
