import KMPlot from '../../../../charts/km/KMPlot';
import VisualizeData from '../../VisualizeData';

import SurvivalCurvesForm from './SurvivalCurvesForm';


const graphs = (graph_type, data) => {
    switch (graph_type) {
        case 'km': return <KMPlot dataState={data} />
        default: return <></>
    }
}

export default function SurvivalCurvesData() {
   
    return (
        <VisualizeData FormToRender={SurvivalCurvesForm} graphsToRender={graphs} />
    )

}