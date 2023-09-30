// These default getters return a new object so it won't be necessary to make
// a deep copy (so that the values won't be shared between plots)
export function getDefaultLayout() {
    return {
        height: 640,
        autosize: true,
        annotations: [],
        shapes: [],
        xaxis: {
            title: { },
            //linecolor: 'black',
            //linewidth: 2,
        },
        yaxis: {
            title: { },
            //linecolor: 'black',
            //linewidth: 2,
        },
        paper_bgcolor: '#eee',
        grid: { 
            pattern: 'independent',
            columns: 1,
            rows: 1
        },
    }
}

export function getDefaultConfig() {
    return {
        toImageButtonOptions: {
            format: 'svg', // one of png, svg, jpeg, webp
        },
        scrollZoom: true,
        responsive: true,
        modeBarButtonsToRemove: ['toImage'],
        doubleClickDelay: 300, // default value (ms)
    }
}