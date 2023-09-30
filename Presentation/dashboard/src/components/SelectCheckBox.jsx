import Select from 'react-select';
import { components } from 'react-select'

const ALL_VALUE = '*'


/*
    Custom suspended list that allows multiple selections
*/
export default function SelectCheckBox({
    className,
    value,
    options,
    selectAll,
    isMulti,
    onChangeHandler,
    maxSelected,
    placeholder,
    isDisabled=false,
 }) {

    let opts = options
    if (selectAll) {
        opts = [{value: ALL_VALUE, label: selectAll}, ...options]
    }

    function onSelectChange(selected, event) {

        // if it allows multiple selections
        if (event && isMulti) {

            // check if the selected option is the "select all" or "remove all"
            if (event.action === 'select-option' && event.option.value === ALL_VALUE) {            
                return onChangeHandler(options)
            } else if (event.action === 'remove-value' && event.removedValue.value === ALL_VALUE) {
                return onChangeHandler([])
            }
        }

        // if neither isMulti nor "select/remove all" then just update that single one
        if (selected) {
            if (maxSelected) {
                // if there can only be 1 selected, select the last one chosen
                if (maxSelected === 1 && selected.length === 2) {
                    return onChangeHandler([selected[1]])
                }
                if (maxSelected < selected.length) {
                    return
                }
            }
            onChangeHandler(selected)
        }
    }

    const ValueContainer = ({ children, ...props }) => {
        const currentValues = props.getValue();
        let toBeRendered = children;
        if (currentValues.some(elem => elem.value === ALL_VALUE)) {
          toBeRendered = [[children[0][0]], children[1]];
        }
      
        return (
          <components.ValueContainer {...props}>
            {toBeRendered}
          </components.ValueContainer>
        );
    };
    
    return (
        <div className={className}>
            <Select
                isDisabled={isDisabled}
                components={{ValueContainer}}
                onChange={onSelectChange} 
                isMulti={isMulti} 
                options={opts} 
                value={value} 
                placeholder={placeholder}
            /> 
        </div>
    )
}
