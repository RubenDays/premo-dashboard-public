import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { Container, Row, Table } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import { FETCH_STATUS, useFetch } from '../../../utils/customHooks';
import { calculateRowsCols, generateLayout, generateNumSamplesAnnotation } from '../../../utils/funcs';
import MyPlot from '../MyPlot';
import { DEFAULT_CONFIG, DEFAULT_LAYOUT, getDefaultConfig, getDefaultLayout } from '../plotDefaults';
import KMPlotController from './KMPlotController';
import { useTranslation, getI18n } from 'react-i18next';


const MAX_NUM_COLS = 3

const DEFAULT_COLORS = ['rgb(31, 119, 180)', 'rgb(255, 127, 14)',
                       'rgb(44, 160, 44)', 'rgb(214, 39, 40)',
                       'rgb(148, 103, 189)', 'rgb(140, 86, 75)',
                       'rgb(227, 119, 194)', 'rgb(127, 127, 127)',
                       'rgb(188, 189, 34)', 'rgb(23, 190, 207)']


export default function KMPlot({ dataState }) {
    const { t } = useTranslation()

    const [chartState, setChartState] = useState({
        // contains data information and plot layout
        chartData: {
            data: [],
            layout: getDefaultLayout(),
            config: getDefaultConfig(),
        },

        // variables changed by controllers
        controllers: { 
            selectedWave: [], // indicates the currently selected wave. nothing means all
            separateWaves: false,
        },
        labels: {
            subtitles: []
        }
    })

    useEffect(() => {
        let graphs = []
        const selectedWave = chartState.controllers.selectedWave
        
        let newState = { ...chartState }
        newState.labels.subtitles = dataState.waves_km_data.map(elem => { return `${t("graphs.labels.wave")} ${elem.subtitle}`})

        if (selectedWave.length > 0) {
            graphs = create_km_plot(dataState.waves_km_data[selectedWave[0].value])
        } else if (chartState.controllers.separateWaves) {
            graphs = createSeparatePlots(dataState.waves_km_data)
        } else {
            graphs = create_km_plot(dataState.all_km_data)
        }

        // make confidence intervals, if there's only 1 line
        /*
        if (data.length === 1) {
            const ci = dataState.data.km_data[0].confidence_interval
            data.push({
                x: ci.timeline,
                y: ci.estimate_lower,
                fill: "tonexty", 
                fillcolor: "rgba(0,100,80,0.2)", 
                line: { color: "transparent" }, 
                name: "KM_1", 
                showlegend: false, 
                type: "scatter",
                legendgroup: dataState.data.km_data[0].title
            })
            data.push({
                x: ci.timeline,
                y: ci.estimate_upper,
                fill: "tonexty", 
                fillcolor: "rgba(0,100,80,0.2)", 
                line: { color: "transparent" }, 
                name: "KM_1", 
                showlegend: false, 
                type: "scatter",
                legendgroup: dataState.data.km_data[0].title
            })
        }
        */

        // set data
        newState.chartData.data = graphs

        // set layout
        newState.chartData.layout = internalGenerateLayout(graphs, selectedWave, chartState.controllers.separateWaves)

        setChartState(newState)
    }, [dataState, getI18n().language])

    function selectWaveHandler(values) {
        let newState = { ...chartState }
        newState.controllers.selectedWave = values
        
        let graphs = []
        if (values.length === 0) {
            graphs = create_km_plot(dataState.all_km_data)
        } else {
            graphs = create_km_plot(dataState.waves_km_data[values[0].value])
        }

        newState.chartData.layout = internalGenerateLayout(graphs, values, false)
        newState.chartData.data = graphs
        
        newState.controllers.separateWaves = false

        setChartState(newState)
    }

    function generateTitle(selectedWave, separateWaves) {
        let suffix = ''
        if (selectedWave.length > 0) {
            suffix = t("graphs.surv-curves.titles.suffix2", { wave: selectedWave[0].label })
        } else if (separateWaves) {
            suffix = t("graphs.surv-curves.titles.suffix3")
        } else {
            suffix = t("graphs.surv-curves.titles.suffix1")
        }
    
        const demo = dataState.demography
        const param = dataState.param
        if (demo && param.paramName) {
            return `${t("graphs.surv-curves.titles.prefix2", { var1: demo, var2:  param.paramName })} ${param.units ? param.units + " " : ""}${suffix}`
        } else if (param.paramName) {
            return `${t("graphs.surv-curves.titles.prefix1", { var1: param.paramName })} ${param.units ? param.units + " " : ""}${suffix}`
        } else if (demo) {
            return `${t("graphs.surv-curves.titles.prefix1", { var1: demo })} ${suffix}`
        }
        return ''
    }

    function internalGenerateLayout(graphs, selectedWave, separateWaves) {
        let layout = generateLayout(
            chartState.chartData.layout,
            graphs,
            chartState.labels.subtitles,
            t("graphs.surv-curves.xtitle"),
            t("graphs.surv-curves.ytitle"),
            MAX_NUM_COLS
        )

        layout.title = generateTitle(selectedWave, separateWaves)

        //const numSamplesAnnots = generateNumSamplesAnnotation(graphs.flat(), layout.grid.rows)
        //layout.annotations = layout.annotations.concat(numSamplesAnnots)

        return layout
    }

    function toggleSeparateWaves(ev) {
        let newState = { ...chartState }
        newState.controllers.separateWaves = !newState.controllers.separateWaves

        let graphs = []
         if (newState.controllers.separateWaves) {
            graphs = createSeparatePlots(dataState.waves_km_data)
        } else {
            graphs = create_km_plot(dataState.all_km_data)
        }

        newState.chartData.layout = internalGenerateLayout(graphs, [], newState.controllers.separateWaves)
        newState.chartData.data = graphs

        newState.controllers.selectedWave = []

        setChartState(newState)
    }

    return (
        <Container>
            <Row>
                <KMPlotController 
                    options={{
                        waves: { 
                            handler: selectWaveHandler,
                            options: dataState.waves_km_data.map((elem, idx) => { return { label: `${t("graphs.labels.wave")} ${elem.subtitle}`, value: idx }}),
                            value: chartState.controllers.selectedWave
                        },
                        separateWaves: { 
                            handler: toggleSeparateWaves,
                            isChecked: chartState.controllers.separateWaves
                        },
                    }}
                />
            </Row>
            <Row style={{marginTop: '1rem'}} >
                <MyPlot 
                    data={chartState.chartData.data.flat()}
                    layout={{...chartState.chartData.layout}}
                    config={chartState.chartData.config}
                />
            </Row>
            <Row style={{marginTop: '1rem'}}>
                <Table striped bordered>
                    <thead>
                        <tr>
                            <th />
                            <th> {t("graphs.surv-curves.table.all")} </th>
                            {dataState.waves_km_data.map(km_data => { return <th key={`th_${km_data.subtitle}`}> {km_data.subtitle} </th>})}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td> <b> {t("graphs.surv-curves.table.test")} </b> </td>
                            <td> <b><i> P Value </i></b> </td>
                            {dataState.waves_km_data.map(km_data => { return <td key={`pval_${km_data.subtitle}`}> <b><i>P Value</i></b> </td> })}
                        </tr>
                        <tr>
                            <td> <b>Logrank</b> </td>
                            <td> {displayPValue(dataState.all_km_data.stats.logrank_pvalue)} </td>
                            {dataState.waves_km_data.map(km_data => { return <td key={`logrank_${km_data.subtitle}`}> {displayPValue(km_data.stats.logrank_pvalue)} </td>})}
                        </tr>
                        <tr>
                            <td> <b>Breslow</b> </td>
                            <td> {displayPValue(dataState.all_km_data.stats.breslow_pvalue)} </td>
                            {dataState.waves_km_data.map(km_data => { return <td key={`logrank_${km_data.subtitle}`}> {displayPValue(km_data.stats.breslow_pvalue)} </td>})}
                        </tr>
                        <tr>
                            <td> <b>Tarone-Ware</b> </td>
                            <td> {displayPValue(dataState.all_km_data.stats.tarone_ware_pvalue)} </td>
                            {dataState.waves_km_data.map(km_data => { return <td key={`logrank_${km_data.subtitle}`}> {displayPValue(km_data.stats.tarone_ware_pvalue)} </td>})}
                        </tr>
                    </tbody>
                </Table>
            </Row>
        </Container>
        
    )
}

function displayPValue(p) {
    if (!p) return NaN
    return p < 0.001 ? '< 0.001' : p.toFixed(3)
} 

function create_km_plot(km_data) {
    let data = []

    km_data.data.forEach(km_plot => data.push({
        name: km_plot.title,
        x: km_plot.survival_function.timeline,
        y: km_plot.survival_function.km_estimate,
        type: 'scatter',
        mode: 'lines',
        line: { shape: 'hv' },
        legendgroup: km_plot.title
    }))

    return [data]
}

function createSeparatePlots(data) {
    let graphs = []
    let legends = {}
    let colorId = 0
    data.forEach((graph, graphIdx) => {
        let sps = []
        const row = graphIdx + 1
        graph.data.forEach((km_plot, spIdx) => {

            // set the legends for the subplots
            let showLegend = false
            // only if it hasn't been set and there's actual values
            if (legends[km_plot.title] === undefined && km_plot.survival_function.km_estimate.length != 0) {
                legends[km_plot.title] = colorId
                showLegend = true
                colorId += 1
            }
            // create the km plot
            sps.push({
                row: row,
                type: 'scatter',
                x: km_plot.survival_function.timeline,
                y: km_plot.survival_function.km_estimate,
                name: km_plot.title,
                xaxis: `x${graphIdx+1}`,
                yaxis: `y${graphIdx+1}`,
                line: { shape: 'hv' },
                legendgroup: km_plot.title,
                mode: 'lines',
                showlegend: showLegend,
                marker: { color: DEFAULT_COLORS[legends[km_plot.title] % DEFAULT_COLORS.length] } // makes it so that every boxplot of the same label have the same colour
            })
        })

        graphs.push(sps)
    })

    return graphs
}
