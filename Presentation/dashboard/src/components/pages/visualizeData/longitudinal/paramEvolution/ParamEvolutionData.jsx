import ScatterLineAggr from '../../../../charts/scatterline/ScatterLineAggr';
import ScatterLineSeparated from '../../../../charts/scatterline/ScatterLineSeparated';
import VisualizeData from '../../VisualizeData';

import ParamEvolutionForm from './ParamEvolutionForm';


const graphs = (graph_type, data) => {
    switch (graph_type) {
        case 'long-separated': return <ScatterLineSeparated dataState={data} />
        case 'long-aggr': return <ScatterLineAggr dataState={data} />
        default: return <></>
    }
}

export default function ParamEvolutionData() {

    return (
        <VisualizeData FormToRender={ParamEvolutionForm} graphsToRender={graphs} />
    )

}
