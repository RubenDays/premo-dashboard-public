import { Alert, Container, Table, Row, Pagination, Col, Form, InputGroup } from "react-bootstrap";
import { faGear, faTrashCan, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserManagementController from "./UserManagementController";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FETCH_STATUS, useFetch } from "../../../../utils/customHooks";
import { MANAGEMENT_USERS_PATH } from "../../../../utils/paths";
import MySpinner from "../../../MySpinner";
import AddUserModal from "./AddUserModal";
import UpdUserModal from "./UpdUserModal";
import { useOutletContext } from "react-router-dom";
import DelUserModal from "./DelUserModal";
import SelectCheckBox from "../../../SelectCheckBox";

const USER_FORM = undefined /*{
    username: undefined,
    role: undefined,
    status: undefined
}*/

const DEFAULT_USER_STATE = {
    showModal: false,
    userForm: USER_FORM
}

const ALERT_TIMEOUT = 15000 /* ms */

const ITEMS_PER_PAGE_OPTS = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
]

const DEFAULT_ITEMS_PER_PAGE = ITEMS_PER_PAGE_OPTS[0]

export default function UserManagement() {
    const [ctx] = useOutletContext()

    const { t } = useTranslation()

    // value in search bar
    const [searchValue, setSearchValue] = useState('')

    // url and query string for fetches
    const [urlParts, setUrlParts] = useState({
        url: '', // full url with query string
        // other query params
        page: 1,
        maxPerPage: DEFAULT_ITEMS_PER_PAGE,
    })

    // fetch state
    const fetchState = useFetch(urlParts.url)

    // user data in tables
    const [data, setData] = useState({
        maxPages: 1,
        users: []
    })

    // form data for new user
    const [addUserState, setAddUserState] = useState(DEFAULT_USER_STATE)
    const [updUserState, setUpdUserState] = useState(DEFAULT_USER_STATE)
    const [delUserState, setDelUserState] = useState(DEFAULT_USER_STATE)

    useEffect(() => {
        if (!addUserState.showModal && addUserState.userForm) {
            setTimeout(() => {
                closeAlert(setAddUserState)
            }, ALERT_TIMEOUT)

            if (data.users.length < urlParts.maxPerPage.value) {
                let newData = { ...data }
                newData.users.push(addUserState.userForm)
                setData(newData)
            }
        }
    }, [addUserState])

    useEffect(() => {
        if (!updUserState.showModal && updUserState.userForm) {
            setTimeout(() => {
                closeAlert(setUpdUserState)
            }, ALERT_TIMEOUT)

            let newData = { ...data }
            newData.users = newData.users.filter(user => user.username !== updUserState.userForm.username)
            newData.users.push(updUserState.userForm)
            setData(newData)
        }
    }, [updUserState])

    useEffect(() => {
        if (!delUserState.showModal && delUserState.userForm) {
            setTimeout(() => {
                closeAlert(setDelUserState)
            }, ALERT_TIMEOUT)

            let newData = { ...data }
            newData.users = newData.users.filter(user => user.username !== delUserState.userForm.username)
            setData(newData)
        }
    }, [delUserState])

    useEffect(() => {
        if (fetchState.status === FETCH_STATUS.OK) {
            setData({
                maxPages: fetchState.resp.max_pages,
                users: fetchState.resp.users,
            })
        }
    }, [fetchState])

    useEffect(() => {
        let delayedReqID = undefined
        // only try to fetch if it's a valid username
        // i.e. if it is within len limit, and doesn't have anything except letter and digits
        if (searchValue.length <= 15 && !/[^A-Za-z0-9]/.test(searchValue)) {
            delayedReqID = setTimeout(() => {
                const newUrlParts = { ...urlParts }
                newUrlParts.page = 1
                newUrlParts.url = createUrl(newUrlParts)
                setUrlParts(newUrlParts)
            }, 500 /* time until the request is made (ms) */)
        } else {
            setData({
                maxPages: 1,
                users: [],
            })
        }
        
        // clear previous delayedCall when search value is changed
        return () => { clearTimeout(delayedReqID) }
    }, [searchValue, setSearchValue])

    // handlers for when something happens in search bar
    function setSearchHandler(ev) {
        setSearchValue(ev.target.value)        
    }

    // handler for when a button is clicked in pagination
    function clickPaginationHandler(page) {
        const newUrlParts = { ...urlParts }
        newUrlParts.page = page
        newUrlParts.url = `${MANAGEMENT_USERS_PATH}?page=${page}&max_per_page=${newUrlParts.maxPerCall}`
        if (searchValue) {
            newUrlParts.url += `&username=${searchValue}`
        }
        setUrlParts(newUrlParts)
    }

    // add new user button click handler
    function addUserHandler(ev) {
        setAddUserState({
            showModal: true,
            userForm: USER_FORM
        })
    }

    function closeAlert(setter) {
        setter({
            showModal: false,
            userForm: USER_FORM
        })
    }

    function updUserHandler(user) {
        setUpdUserState({
            showModal: true,
            userForm: user
        })
    }

    function delUserHandler(user) {
        setDelUserState({
            showModal: true,
            userForm: user
        })
    }

    function onChangeItemsPerPage(value) {
        let newUrlParts = { ...urlParts }
        newUrlParts.maxPerPage = value
        newUrlParts.url = createUrl(newUrlParts)
        setUrlParts(newUrlParts)
    }

    function createUrl(newUrlParts) {
        let newUrl = `${MANAGEMENT_USERS_PATH}?page=${newUrlParts.page}&max_per_page=${newUrlParts.maxPerPage.value}`
        if (searchValue) {
            newUrl += `&username=${searchValue}`
        }
        return newUrl
    }

    const handlers = { update: updUserHandler, delete: delUserHandler }

    return (
        <Container className="ctn-visualize" style={{width: '80%'}}>

            {addUserState.showModal && <AddUserModal showModal={addUserState.showModal} setAddUserState={setAddUserState} />}
            <UpdUserModal showModal={updUserState.showModal} user={updUserState.userForm} setUpdUserState={setUpdUserState} />
            <DelUserModal showModal={delUserState.showModal} user={delUserState.userForm} setDelUserState={setDelUserState} />

            {/* Title */}
            <Row>
                <h2>{t("manage-users-page.title")}</h2>
            </Row>

            {/* Alert when creating/updating/deleting a user */}
            <Row>
                {/* Modal for successfully adding a user */}
                {addUserState.userForm &&
                    <Alert show={!!addUserState.userForm} variant={'success'} onClose={() => closeAlert(setAddUserState)} dismissible>
                        <FontAwesomeIcon icon={faCircleCheck} size='lg' /> {t("manage-users-page.alerts.user")} <b>{addUserState.userForm.username}</b> {t("manage-users-page.alerts.added")}
                    </Alert>
                }

                {/* Modal for successfully updating a user */}
                {!updUserState.showModal && updUserState.userForm &&
                    <Alert show={!!updUserState.userForm} variant={'success'} onClose={() => closeAlert(setUpdUserState)} dismissible>
                        <FontAwesomeIcon icon={faCircleCheck} size='lg' /> {t("manage-users-page.alerts.user")} <b>{updUserState.userForm.username}</b> {t("manage-users-page.alerts.updated")}
                    </Alert>
                }

                {/* Modal for successfully removing a user */}
                {!delUserState.showModal && delUserState.userForm &&
                    <Alert show={!!delUserState.userForm} variant={'success'} onClose={() => closeAlert(setDelUserState)} dismissible>
                        <FontAwesomeIcon icon={faCircleCheck} size='lg' /> {t("manage-users-page.alerts.user")} <b>{delUserState.userForm.username}</b> {t("manage-users-page.alerts.deleted")}
                    </Alert>
                }
            </Row>

            {/* Controller */}
            <UserManagementController 
                options={{
                    search: {
                        value: searchValue,
                        handler: setSearchHandler 
                    },
                    addUser: {
                        handler: addUserHandler
                    }
                }}
            />

            {/* Table */}
            <Row>
                {fetchState.status === FETCH_STATUS.PENDING && <MySpinner />}
                {fetchState.status === FETCH_STATUS.OK && buildTable(data, ctx.session.user, handlers, t)}
            </Row>

            {/* Pagination */}
            <Row>
                <Col>
                    <InputGroup className='mb-3'>
                        <Form.Text style={{padding: '0.2rem 0.5rem 0 0'}}> {t("manage-users-page.pagination")} </Form.Text>
                        <SelectCheckBox
                            className={'basic-single'}
                            value={[urlParts.maxPerPage]}
                            options={ITEMS_PER_PAGE_OPTS}
                            onChangeHandler={onChangeItemsPerPage}
                        />
                    </InputGroup>
                </Col>
                <Col>
                    {buildPagination(urlParts.page, data.maxPages, clickPaginationHandler)}
                </Col>
                
            </Row>
            
        </Container>
    )

}

const maxShowPages = 3
function buildPagination(page, maxPages, handler) {
    const currPage = <Pagination.Item className='page-active' active>{page}</Pagination.Item>
    const prevs = []
    const nexts = []
    
    // calculate how many pages in next
    let maxNext = Math.min(page + maxShowPages - 1, maxPages)
    if (page > 1) {
        maxNext = Math.min(page + ((maxShowPages - 1) / 2), maxPages)
    }
    
    // create next pages
    for (let i = page; i < maxNext; i++) {
        const id = i + 1
        nexts.push(<Pagination.Item className='page-inactive' key={`next-${id}`} onClick={() => handler(id)}>{id}</Pagination.Item>)
    }

    // create previous pages. the calculation is done by comparing how many left from nexts
    const maxPrev = Math.min(maxShowPages - 1 - nexts.length, maxPages - 1 - nexts.length)
    for (let i = maxPrev; i >= 1; i--) {
        const id = page - i
        prevs.push(<Pagination.Item className='page-inactive' key={`prev-${id}`} onClick={() => handler(id)}>{id}</Pagination.Item>)
    }

    const addFirst = (page - maxShowPages) >= 0

    return (
        <Pagination>
            <Pagination.Prev className='page-inactive' onClick={() => handler(page-1)} disabled={page === 1} />

            {addFirst && <Pagination.Item className='page-inactive' onClick={() => handler(1)}>{1}</Pagination.Item>}
            {addFirst && <Pagination.Ellipsis className='page-inactive' disabled />}

            {prevs.map(elem => { return elem })}
            {currPage}
            {nexts.map(elem => { return elem })}

            {maxPages - page >= maxShowPages - 1 && <Pagination.Ellipsis className='page-inactive' disabled />}
            {maxPages > page + 1 && <Pagination.Item className='page-inactive' onClick={() => handler(maxPages)}>{maxPages}</Pagination.Item>}
            
            <Pagination.Next className='page-inactive' onClick={() => handler(page+1)} disabled={page === maxPages} />
        </Pagination>
    )
}

function buildTable(data, user, handlers, t) {
    return (
        <Table striped bordered hover >
            <thead>
                <tr>
                    <th style={{width: '12rem'}}>{t("manage-users-page.table.username")}</th>
                    <th style={{width: '12rem'}}>{t("manage-users-page.table.role")}</th>
                    <th style={{width: '6rem'}}>{t("manage-users-page.table.state.name")}</th>
                    <th style={{width: '8rem'}}>{t("manage-users-page.table.action")}</th>
                </tr>
            </thead>
            <tbody>
                {data.users.map(elem => { return (
                        <tr key={elem.username}>
                            <td>{elem.username}</td>
                            <td>{elem.role}</td>
                            <td className="th-user-status">{elem.enabled 
                                ? <Alert className="plain-user-status" key={`${elem.username}-status`} variant='success'> {t("manage-users-page.table.state.active")} </Alert>
                                : <Alert className="plain-user-status" key={`${elem.username}-status`} variant='danger'> {t("manage-users-page.table.state.inactive")} </Alert>}
                            </td>
                            {user !== elem.username
                            ?
                                <td>
                                    <FontAwesomeIcon className='fa-manage-user-icon' size="xl" icon={faGear} onClick={() => handlers.update(elem)} />
                                    <FontAwesomeIcon className='fa-delete-user-icon' size="xl" icon={faTrashCan} onClick={() => handlers.delete(elem)} />
                                </td>
                            :   <td />
                            }
                        </tr>
                    )
                })}
            </tbody>
        </Table>
    )
}
