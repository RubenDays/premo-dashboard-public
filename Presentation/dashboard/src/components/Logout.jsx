import { useEffect} from 'react';
import { Navigate, useOutletContext } from 'react-router-dom'

import { LOGOUT_PATH } from '../utils/paths';
import { FETCH_STATUS, useFetch } from '../utils/customHooks';
import MySpinner from './MySpinner';


/**
 * Component to log out the user.
 * @returns component
 */
export default function Logout() {    
    const [ctx, setCtx] = useOutletContext()
    const logoutState = useFetch(LOGOUT_PATH, {method: 'POST'})
    console.log(logoutState)

    useEffect(() => {
        if (ctx) {
            clearInterval(ctx.session.renewInterval)
        }

        if (logoutState.status === FETCH_STATUS.OK) {
            sessionStorage.setItem('loggedin', 'false')
            setCtx(undefined)
        } else if (logoutState.status === FETCH_STATUS.NOK) {
            sessionStorage.setItem('loggedin', 'false')
            setCtx(undefined)
        }
    }, [logoutState])

    if (!ctx) {
        return <Navigate to='/' replace />
    }

    return <MySpinner />
}
