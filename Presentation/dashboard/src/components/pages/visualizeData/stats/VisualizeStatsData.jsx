import BoxPlot from '../../../charts/boxplot/BoxPlot';
import NominalChart from '../../../charts/nominal/NominalChart';
import ScatterPlot from '../../../charts/scatterplot/ScatterPlot';
import VisualizeData from '../VisualizeData';
import VisualizeStatsForm from './VisualizeStatsForm';


const graphs = (graph_type, data) => {
    switch (graph_type) {
        case 'nominal': return <NominalChart dataState={data}/>
        case 'nominal-quant': return <BoxPlot dataState={data} />
        case 'quant': return <ScatterPlot dataState={data} />
        default: return <></>
    }
}

export default function VisualizeStatsData() {
    
    return (
        <VisualizeData FormToRender={VisualizeStatsForm} graphsToRender={graphs} />            
    )

}