import { REFRESH_PATH } from "./paths"


/**
 * Removes an error from the total error code
 * @param {number} err current error code to remove from 
 * @param {number} error_code the error code to be removed from err
 * @returns a new error code without error_code
 */
export function removeError(err, error_code) {
    return err & (-1 - error_code)
}


/**
 * Adds an error from the total error code
 * @param {number} err current error code to add to 
 * @param {number} error_code the error code to be added to err
 * @returns a new error code with error_code
 */
export function addError(err, error_code) {
    return err | error_code
}


/**
 * Creates and interval to make requests to refresh the tokens.
 * @returns id of the interval created.
 */
export function createRenewInterval() {
    return setInterval(async function() {
        const configObj = {
            method: 'POST',
            credentials: 'include'
        }
        const resp = await fetch(REFRESH_PATH, configObj)
    }, 25*60*1000 /* 25mins*/)
}

/**
 * Calculates and returns the number of rows and columns for the subplots
 * @param {number} size amount of graphs
 * @param {number} max_cols maximum number of columns per row
 * @returns the number of rows and columns for the subplots 
 * {
 *  rows: number,
 *  columns: number
 * }
 */
export function calculateRowsCols(size, max_cols) {
    if (!size || !max_cols || size <= 0 || max_cols <= 0) return { rows: 0, columns: 0}

    const columns = size < max_cols ? size : max_cols
    const tmp = size / max_cols
    const rows = size <= max_cols
    ? 1
    : Number.isInteger(tmp)
        ? tmp
        : Math.floor(tmp) + 1

    return { rows, columns }

}

export function generateLayout(mainLayout, graphs, data, masterXTitle, masterYTitle, maxNumCols) {
    // set the layout of the plot
    let layout = { ...mainLayout }
    // layout.title = generateTitle(selectedWave, separateWaves)

    layout.grid = calculateRowsCols(graphs.length, maxNumCols)
    layout.grid.pattern = 'independent'

    let annotations = []

    // only relevant to have a subtitle if there's more than 1 graph
    if (graphs.length > 1) {
        // make subplots' titles
        graphs.forEach((graph, idx) => {
            annotations.push({
                text: data[idx].subtitle,
                annot_name: 'subtitle',
                font: { size: 13.5 },
                showarrow: false,
                x: 1,
                y: 1 + (layout.grid.rows * 0.06),
                xref: `${graph[0].xaxis} domain`,
                yref: `${graph[0].yaxis} domain`
            })
        })
    }

    if (layout.grid.rows > 1) {
        // clear title if there's more than 1 row. An annotation will be used instead, so it an be centered.
        layout.xaxis.title.text = ''
        layout.yaxis.title.text = ''

        // adds master y axis title
        annotations.push({
            text: masterYTitle,
            annot_name: 'title',
            font: { size: 15 },
            showarrow: false,
            x: -0.075,
            y: 0.5,
            xref: 'paper',
            yref: 'paper',
            textangle: -90
        })

        // adds master x axis title
        annotations.push({
            text: masterXTitle,
            annot_name: 'title',
            font: { size: 15 },
            showarrow: false,
            x: 0.5,
            y: -0.14,
            xref: 'paper',
            yref: 'paper',
        })
    } else {
        // defines the master title by the layout itself, only if there's 1 row only
        layout.xaxis.title.text = masterXTitle
        layout.yaxis.title.text = masterYTitle
    }

    layout.annotations = annotations

    return layout
}


/**
 * 
 * @param {object} graphs generated for the plots
 * @param {int} rows number of grid rows
 * @param {boolean} useXName indicates wether to align the numSamples in the center X of the subplot or 
 *                           to center it on the label (e.g. in case of subplots)
 * @returns 
 */
export function generateNumSamplesAnnotation(graphs, rows, useXName=false) {
    const annotations = []
    // set the number of samples for each boxplot
    graphs.forEach(graph => {        
        // only add annotation for boxplots that actually have any values
        if (graph.y.length > 0) {
            annotations.push({
                xref: `${graph.xaxis}${useXName ? "" : " domain"}`,
                annot_name: 'numsample',
                x: useXName ? graph.name : 0.5,
                text: `<i>n<\i>=${graph.y.length}`,
                yref: `${graph.yaxis} domain`,
                y: rows * -0.09,
                showarrow: false,
            })
        }
    })
    return annotations
}


/**
 * Converts the value to have 3 floating points.
 * @param {number} v value 
 * @returns number with 3 floating points.
 */
export function testValueDisplayString(v) {
    return v < 0.001 ? v.toExponential(3) : v.toFixed(3)
}


/**
 * Generates the test value annotation for the plot
 * @param {number} numRows number of rows in the grid 
 * @param {string} xaxis value of the xaxis. Tells which plot X it refers to
 * @param {string} yaxis values of yaxis. Tells which plot Y it refers to
 * @param {string} text text to presented about the value
 * @returns annotation object
 */
export function generateTestValueAnnotation(numRows, xaxis, yaxis, text) {
    return {
        x: 0.03,
        y: 1 + (0.08 * numRows),
        annot_name: 'testvalue',
        text: text,
        xref: `${xaxis} domain`,
        yref: `${yaxis} domain`,
        showarrow: false
    }
}