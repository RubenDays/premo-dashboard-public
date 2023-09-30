import { Navigate, useOutletContext } from "react-router-dom"


export default function Home() {
    const [ctx, setCtx] = useOutletContext()

    const loggedIn = sessionStorage.getItem('loggedin')

    if (ctx && loggedIn) {
       return <Navigate to='/dashboard' replace/>
    }

    return (
        <h1>Home</h1>
    )

}