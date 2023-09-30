import { useState } from 'react';
import BarChart from '../bar/BarChart';
import CircularChart from '../circular/CircularChart';
import NominalController from './NominalController';

const graphs = [
    { label: 'Gráfico barras', value: 'bar' },
    { label: 'Gráfico circular', value: 'circular' }
]

export default function NominalChart({ dataState }) {
    const [chart, setChart] = useState(graphs[0])
    const [controllers, setControllers] = useState({
        selectedWave: [],
        separateWaves: false
    })

    function chartSelectHandler(value) {
        setChart(value)
    }

    function getChart() {
        switch(chart.value) {
            case 'circular': return <CircularChart dataState={dataState} controllers={controllers} />
            case 'bar': return <BarChart dataState={dataState} controllers={controllers} />
            default: return <></>
        }
    }

    function toggleSeparateWaves() {
        setControllers({
            selectedWave: [],
            separateWaves: !controllers.separateWaves
        })
    }

    function selectWaveHandler(value) {
        setControllers({
            selectedWave: value,
            separateWaves: false
        })
    }

    return (
        <div>
            <NominalController options={{
                chart: {
                    options: graphs,
                    value: chart,
                    handler: chartSelectHandler
                },
                separateWaves: { 
                    handler: toggleSeparateWaves,
                    isChecked: controllers.separateWaves
                },
                waves: { 
                    handler: selectWaveHandler,
                    options: dataState.data.map((elem, idx) => { return { label: elem.subtitle, value: idx }}),
                    value: controllers.selectedWave
                }
            }}/>
            {getChart()}            
        </div>
    )

}
