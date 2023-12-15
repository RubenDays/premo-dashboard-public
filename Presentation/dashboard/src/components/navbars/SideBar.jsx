import { faDownload, faUpload, faChartLine, faChartPie, faUserGear, faHouse, faUser } from '@fortawesome/free-solid-svg-icons'
import Nav from 'react-bootstrap/Nav';
import SideBarItem from './SideBarItem';
import { useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next'


export default function SideBar() {
    const [ctx] = useOutletContext()
    const { t } = useTranslation()

    return (
        <div>
            <Nav className='sidebar'>
                { ctx && 
                    <div>
                        <FontAwesomeIcon className={'sidebar-user-item'} size="2x" icon={faUser} />
                        <span className='sidebar-user-title'> {ctx.session.user} </span>
                    </div>
                }
                <hr className='sidebar-hr' />
                <SideBarItem title={t('sidebar.homepage')} icon={faHouse} path='/' />
                <SideBarItem title={t('sidebar.cross-data')} icon={faChartPie} path='/visualize-stats' />
                <SideBarItem title={t('sidebar.long-data')} icon={faChartLine}>
                    <SideBarItem title={t('sidebar.surv-curves')} path='/visualize-longitudinal/survival-curves' />
                    <SideBarItem title={t('sidebar.evol-params')} path='/visualize-longitudinal/params-evolution' />
                </SideBarItem>
                <SideBarItem title={t('sidebar.export')} icon={faDownload} path='/export' />
                <SideBarItem title={t('sidebar.import')} icon={faUpload} path='/import' />
                { ctx && ctx.session.role === 'admin' && 
                    <SideBarItem title={t('sidebar.manage-users')} icon={faUserGear} path='/user-management'/>
                }
            </Nav>
        </div>
    )
}
