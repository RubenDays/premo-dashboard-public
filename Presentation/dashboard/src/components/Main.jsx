import { useEffect, useState } from 'react'
import { Navigate, Outlet, useOutletContext } from "react-router-dom"
import { VERIFY_AUTH_PATH, LOGOUT_PATH } from '../utils/paths'
import NavBar from './navbars/NavBar'
import { FETCH_STATUS, useFetch } from '../utils/customHooks'
import { createRenewInterval } from '../utils/funcs'


export default function Main() {
    const [ctx, setCtx] = useState()
    const fetchState = useFetch(VERIFY_AUTH_PATH)

    /*
    async function logout() {
        const configObj = {
            method: 'POST',
            credentials: 'include',
            //signal: signal
        }

        try {
            const resp = await fetch(LOGOUT_PATH, configObj)
             if (isCancelled) {
                return
            }
           
            const json = await resp.json()
            if (isCancelled) {
                return
            }
            console.log(json)

        } catch(error) {
            console.log(error)
        }

    }
    */

    useEffect(() => {
        if (fetchState.status === FETCH_STATUS.OK) { 
            sessionStorage.setItem('loggedin', 'true')
            fetchState.resp.session.renewInterval = createRenewInterval()
            setCtx(fetchState.resp)
        } else {
            sessionStorage.removeItem('loggedin')
            setCtx(undefined)
        }
    }, [fetchState])

    const loggedInState = sessionStorage.getItem('loggedin')
    if (ctx // if login successfull
        || (fetchState.status === FETCH_STATUS.NOK) // if an error occurred
        || (loggedInState && loggedInState === 'false')
    
    ) {
        return <Outlet context={[ctx, setCtx, fetchState]} />
    }

    return (
        <>
           
        </>
    )

}