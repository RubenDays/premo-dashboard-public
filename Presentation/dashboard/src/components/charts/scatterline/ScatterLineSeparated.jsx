import { useState, useEffect } from 'react';
import { Row, Container  } from 'react-bootstrap';
import MyPlot from '../MyPlot';
import { getDefaultConfig, getDefaultLayout } from '../plotDefaults';
import { useTranslation, getI18n } from 'react-i18next';


const MAX_NUM_COLS = 3

export default function ScatterLinePlotly({ dataState }) {
    const { t } = useTranslation()
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
    }, [dataState, getI18n().language])

    function generateLayout() {
        // set the layout of the plot
        let layout = { ...chartState.chartData.layout }

        const label = dataState.param
        let prefix = ''
        if (label.analysis_name) {
            prefix = `${t("graphs.scatter-lines-sep.titles.prefix2", { analysis: label.analysis_name, param: label.param_name })}${label.units ? ' ' + label.units : ''}`
        } else {
            prefix = `${t("graphs.scatter-lines-sep.titles.prefix1", { param: label.param_name })}${label.units ? ' ' + label.units : ''}`
        }

        console.log(prefix)

        layout.title = `${prefix} ${t("graphs.scatter-lines-sep.titles.suffix")}`
        layout.xaxis.title.text = t("graphs.scatter-lines-sep.xtitle")
        layout.yaxis.title.text = `${dataState.param.param_name} ${dataState.param.units ? dataState.param.units : ''}`

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
