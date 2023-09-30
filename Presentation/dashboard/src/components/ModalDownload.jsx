import React, { useEffect, useState } from 'react';
import { Row, Container, Form, Col, InputGroup, Modal, Button  } from 'react-bootstrap';
import Plotly from 'plotly.js-dist'
import SelectCheckBox from './SelectCheckBox';


const DEFAULT_FILENAME = 'premo-plot'
const DL_FORMATS = [
    {label: 'PNG', value: 'png'},
    {label: 'SVG', value: 'svg'},
    {label: 'JPEG', value: 'jpeg'},
    {label: 'WebP', value: 'webp'},
]

export const DEFAULT_DL_OPT = { 
    gd: undefined,
    filename: DEFAULT_FILENAME,
    format: [
        {label: 'PNG', value: 'png'}
    ]
}


/**
 * Subcomponent used by MyPlot (for organization) that draws the modal for downloading images in multiple formats.
 * Requires 'dlOpt' which is the getter from a state and 'setDlOpt' which is the setter for that state.
 * This dlOpt has the same format as DEFAULT_DL_OPT.
 */
export default function ModalDownload({ dlOpt, setDlOpt }) {

    function handleCloseModal() {
        setDefaultDlOpt()
    }

    function handleAcceptModal() {
        if (dlOpt.format) {
            Plotly.downloadImage(dlOpt.gd, {
                filename: dlOpt.filename ? dlOpt.filename : DEFAULT_FILENAME,
                format: dlOpt.format.value,
            })
        }

        setDefaultDlOpt()
    }

    function setDefaultDlOpt() {
        setDlOpt(DEFAULT_DL_OPT)
    }

    function onChangeFormatExport(values) {
        const newDlOpt = { ...dlOpt}
        newDlOpt.format = values
        setDlOpt(newDlOpt)
    }

    function onChangeFilename(ev) {
        const newDlOpt = { ...dlOpt}
        newDlOpt.filename = ev.target.value
        setDlOpt(newDlOpt)
    }

    return (
        <Modal className={'modal-dl'} show={dlOpt.gd} onHide={handleCloseModal}>
            <Modal.Header closeButton>
                <Modal.Title>Descarregar Imagem</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <InputGroup>
                    <Form.Control defaultValue={dlOpt.filename} onChange={onChangeFilename} type='text' style={{width: '10px', textAlign: 'end'}} />
                    <Form.Text style={{fontSize: '20px', paddingRight: '0.5rem', paddingLeft: '0.5rem'}}> . </Form.Text>
                    <SelectCheckBox
                        className={'basic-single'}
                        value={dlOpt.format}
                        options={DL_FORMATS}
                        onChangeHandler={onChangeFormatExport}
                    />
                </InputGroup>
            </Modal.Body>
            <Modal.Footer style={{justifyContent: 'center'}}>
                <Button className='btn-generic' onClick={handleAcceptModal}>
                    Descarregar
                </Button>
            </Modal.Footer>
        </Modal>
    )
}