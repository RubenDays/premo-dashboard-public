import { useEffect, useState } from 'react';
import { Row, Container  } from 'react-bootstrap';
import { getDefaultConfig, getDefaultLayout } from '../plotDefaults';
import MyPlot from '../MyPlot';
import { useTranslation, getI18n } from 'react-i18next';

const MAX_NUM_COLS = 3

export default function BarChart({ dataState, controllers }) {
    const{ t } = useTranslation()
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

        newState.chartData.layout = generateLayout(controllers.selectedWave)

        setChartState(newState)
    }, [dataState, controllers, getI18n().language])

    function generateLayout(selectedWave) {
        // set the layout of the plot
        let layout = {... chartState.chartData.layout }
        layout.title = getTitle(selectedWave)

        layout.annotations = []

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

            {/* Bar Chart */}
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

    const total = calcTotal(joinedData)

    return [{
        y: joinedData,
        x: labels,
        type: 'bar',
        text: joinedData.map(val => writeBarText(val, total)),
        marker: {
            opacity: 0.8,
        }
    }]

}

function separateWaves(subtitles, data, labels) {
    let graphs = []

    const totals = data.map(d => calcTotal(d.values))
    
    labels.forEach((label, idx) => {
        let y = data.map(graph => graph.values[idx])
        const total = calcTotal(y)
        graphs.push({
            y: y,
            x: subtitles,
            type: 'bar',
            text: y.map((val, y_idx) => writeBarText(val, totals[y_idx])),
            name: label,
            marker: { opcacity: 0.8 }
        })
    })

    return graphs
}

function writeBarText(val, total) {
    const prob = ((val / total)).toFixed(3) * 100
    return `${val} <br /> (${String(prob.toFixed(3))} %)`
}

function calcTotal(values) {
    return values.reduce((acc, val) => { return acc + val }, 0)
}
