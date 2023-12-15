import React from 'react'


// Options for dropdown lists
export type Option = {
    value: string,
    label: string
}

// normal on change handler
export type OnChangeHandler = React.ChangeEventHandler<HTMLInputElement>

export type OnChangeRatio = (ev: any, idx: number) => void
