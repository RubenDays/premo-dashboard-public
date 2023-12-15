import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-dist'
import { useState } from 'react';
import ModalDownload, { DEFAULT_DL_OPT } from '../ModalDownload';
import { useTranslation } from 'react-i18next';


export default function({className, ...props}) {
    const { t } = useTranslation()

    // Adds a button to download images in multiple formats
    props.config.modeBarButtonsToAdd = [{
        name: t("plotly-buttons.download-img"),
        icon: Plotly.Icons.camera,
        direction: 'up',
        click: onClickDownload
    }]

    const [dlOpt, setDlOpt] = useState(DEFAULT_DL_OPT)

    function onClickDownload(gd) {
        let newDlOpt = { ...dlOpt }
        newDlOpt.gd = gd
        setDlOpt(newDlOpt)
    }

    return (
        <div className='myplot-div'>
            <ModalDownload dlOpt={dlOpt} setDlOpt={setDlOpt} />

            <Plot
                className={className ? className : 'plot'}
                {...props}
            />
        </div>
    )
}