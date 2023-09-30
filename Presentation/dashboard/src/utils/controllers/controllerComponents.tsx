import { Form, InputGroup, Row, Col, Container } from 'react-bootstrap';
import SelectCheckBox from '../../components/SelectCheckBox';
import { Option, OnChangeHandler } from '../types'


type SelectWaveControllerProps = {
    value: Array<Option>,
    handler: OnChangeHandler,
    options: Array<Option>
}
export function SelectWaveController({ value, handler, options }: SelectWaveControllerProps) {

    /* select wave controller */
    return (
        <Form.Group style={{width: '178px'}}>
            <SelectCheckBox
                className={undefined}
                value={value}
                maxSelected={1}
                isMulti
                selectAll={undefined}
                onChangeHandler={handler}
                options={options} 
                placeholder={'Escolher Vaga'} />
        </Form.Group>
    )
}


type SeparateWavesControllerProps = {
    isChecked: boolean,
    handler: OnChangeHandler,
}
export function SeparateWavesController({ isChecked, handler }: SeparateWavesControllerProps) {

    /* toggle show separated waves controller */
    return (
        <Form.Group>
            <InputGroup>
                <Form.Check 
                    type="checkbox"
                    checked={isChecked}
                    onChange={handler} 
                    label='Separar por vagas' 
                />      
            </InputGroup>
        </Form.Group>
    )

}