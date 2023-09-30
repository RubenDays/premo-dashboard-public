import { Spinner } from "react-bootstrap";
import React from "react";


/*
    Draws a custom spinner to show it's "loading"
 */
export default function MySpinner({ className }) {
    return (
        <div className={className ? className : 'spinner-div'}>
            <Spinner role='status' className="lg" animation='border' />
        </div>
    )
}