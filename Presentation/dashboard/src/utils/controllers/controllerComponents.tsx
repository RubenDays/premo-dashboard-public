import { Form, InputGroup } from 'react-bootstrap';
import SelectCheckBox from '../../components/SelectCheckBox';
import { Option, OnChangeHandler } from '../types'
import { useTranslation } from 'react-i18next'

type SelectWaveControllerProps = {
    value: Array<Option>,
    handler: OnChangeHandler,
    options: Array<Option>
}
export function SelectWaveController({ value, handler, options }: SelectWaveControllerProps) {
    const { t } = useTranslation()

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
                placeholder={t("controller-generic.wave-placeholder")} />
        </Form.Group>
    )
}


type SeparateWavesControllerProps = {
    isChecked: boolean,
    handler: OnChangeHandler,
}
export function SeparateWavesController({ isChecked, handler }: SeparateWavesControllerProps) {
    const { t } = useTranslation()

    /* toggle show separated waves controller */
    return (
        <Form.Group>
            <InputGroup>
                <Form.Check 
                    type="checkbox"
                    checked={isChecked}
                    onChange={handler} 
                    label={t("controller-generic.separate-waves-cb")} 
                />      
            </InputGroup>
        </Form.Group>
    )

}