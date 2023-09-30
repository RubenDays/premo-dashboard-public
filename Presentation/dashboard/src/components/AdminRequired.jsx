import { useState, useEffect } from 'react'
import { Navigate, Outlet, useOutletContext } from "react-router-dom"

import Spinner from 'react-bootstrap/Spinner';

import SideNavBar from './navbars/SideNavBar'
import { FETCH_STATUS } from '../utils/customHooks';
import MySpinner from './MySpinner';


/**
 * Component that verifies if the user is logged in or not.
 * @returns component
 */
export default function AdminRequired() {
    const [ctx] = useOutletContext()
        
    if (ctx.session.role !== 'admin') {
        return <Navigate to='/login' replace />
    }

    return (
        <>
            <SideNavBar />            
        </>
    )
           
}
