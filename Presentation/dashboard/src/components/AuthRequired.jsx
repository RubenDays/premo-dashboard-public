import { useState } from 'react'
import { Navigate, useOutletContext } from "react-router-dom"

import SideNavBar from './navbars/SideNavBar'
import { FETCH_STATUS } from '../utils/customHooks';
import MySpinner from './MySpinner';


/**
 * Component that verifies if the user is logged in or not.
 * @returns component
 */
export default function AuthRequired() {
    // const [user, setUser, fetchState] = useOutletContext()
    const [ctx, setCtx, loginState] = useOutletContext()

    if (loginState.status === FETCH_STATUS.PENDING) {
        return <MySpinner />
    }
    
    if (!ctx) {
        return <Navigate to='/login' replace />
    }

    return (
        <>
            <SideNavBar />            
        </>
    )
    
}
