import { useEffect, useReducer } from 'react'


/**
 * Enum to indicate the state of the fetch.
 */
export const FETCH_STATUS = {
    IDLE: 0,
    PENDING: 1,
    OK: 2,
    NOK: 3,
}

/**
 * Enum for the errors.
 */
export const FETCH_ERRORS = {
    BAD_REQUEST: 0, // malformed http requests
    UNAUTHORIZED: 1,    // invalid credentials
    INTERNAL_ERROR: 2,  // dashboard error
    SERVER_ERROR: 3,    // api error
}

// initial fetch state
const INITIAL_STATE = { 
    status: FETCH_STATUS.IDLE,
    resp: {},
    status_code: undefined,
    error: undefined,
    isIdle: function() { return this.status === FETCH_STATUS.IDLE },
    isPending: function() { return this.status === FETCH_STATUS.PENDING },
    isOk: function() { return this.status === FETCH_STATUS.OK },
    isNok: function() { return this.status === FETCH_STATUS.NOK },
}

function fetchReducer(state, event) {
    switch (state.status) {
        case FETCH_STATUS.IDLE:
            if (event.status === FETCH_STATUS.PENDING) {
                let newState = { ...state }
                newState.status = FETCH_STATUS.PENDING
                newState.resp = {}
                newState.status_code = undefined
                newState.error = undefined
                return newState
            }
        case FETCH_STATUS.PENDING: 
            if (event.status === FETCH_STATUS.OK) {
                let newState = { ...state }
                newState.status = FETCH_STATUS.OK
                newState.resp = event.resp
                newState.status_code = event.status_code
                newState.error = undefined
                return newState
            }

            if (event.status === FETCH_STATUS.NOK) {
                let newState = { ...state }
                newState.status = FETCH_STATUS.NOK
                newState.resp = event.resp
                newState.status_code = event.status_code
                newState.error = event.error
                return newState
            }
        default: {
            let newState = { ...state }
            newState.status = event.status
            newState.resp = event.resp
            newState.status_code = event.status_code
            newState.error = event.error
            return newState
        }
    }

}


/**
 * Hook to make requests using fetch.
 * @param {string} pathURL containing the URL where to make the request.
 * @param {object} configObj object containing configurations for the fetch.
 * @param {boolean} isJson indicates if the result is json or a blob
 * @returns the state of the request. If it is completed also contains the response.
 *  {
 *      status: FETCH_STATUS,
 *      resp: response object,
 *      status_code: status (only if the response is not OK)
 *  }
 */
export function useFetch(pathURL, configObj = {}, isJson = true) {
    const [state, dispatch] = useReducer(fetchReducer, INITIAL_STATE)

    useEffect(() => {
        const controller = new AbortController()
        let signal = controller.signal
        let isCancelled = false
        configObj.signal = signal
        configObj.credentials = 'include'

        if (state.status !== FETCH_STATUS.IDLE) {
            dispatch(INITIAL_STATE)
        }

        async function doFetch() {
            try {
                if (!pathURL) {
                    dispatch(INITIAL_STATE)
                    return
                }

                dispatch({ status: FETCH_STATUS.PENDING })

                const resp = await fetch(pathURL, configObj)
                if (isCancelled) {
                    dispatch(INITIAL_STATE)
                    return
                }

                if (!resp.ok) {
                    const errJson = await resp.json()
                    const status_error = getStatusError(resp.status)
                    dispatch({
                         status: FETCH_STATUS.NOK,
                         resp: errJson,
                         status_code: resp.status,
                         error: status_error
                    })
                    return
                }

                const content = isJson ? await resp.json() : await resp.blob()

                dispatch({
                    status: FETCH_STATUS.OK,
                    resp: content,
                    status_code: resp.status_error,
                })

            } catch(error) {
                dispatch({
                    status: FETCH_STATUS.NOK,
                    error: FETCH_STATUS.INTERNAL_ERROR,
                    resp: error,
                    status_code: undefined
                })
            }
        }

        doFetch()
        
        return () => {
            isCancelled = true
            controller.abort()
        }

    }, [pathURL])

    return state
}

function getStatusError(status) {
    switch (true) {
        case status >= 500 && status <= 599: return FETCH_ERRORS.SERVER_ERROR
        case status === 400: return FETCH_ERRORS.BAD_REQUEST
        case status === 401: return FETCH_ERRORS.UNAUTHORIZED
        default: return FETCH_ERRORS.INTERNAL_ERROR
    }
}
