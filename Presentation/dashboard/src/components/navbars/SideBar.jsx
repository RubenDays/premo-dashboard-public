import { faDownload, faUpload, faChartLine, faChartPie, faUserGear, faHouse, faUser } from '@fortawesome/free-solid-svg-icons'
import Nav from 'react-bootstrap/Nav';
import SideBarItem from './SideBarItem';
import { useOutletContext } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export default function SideBar() {
    const [ctx] = useOutletContext()

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
                <SideBarItem title='Página Inicial' icon={faHouse} path='/' />
                <SideBarItem title='Dados Transversais' icon={faChartPie} path='/visualize-stats' />
                <SideBarItem title='Dados Longitudinais' icon={faChartLine}>
                    <SideBarItem title='Curvas Sobrevivência' path='/visualize-longitudinal/survival-curves' />
                    <SideBarItem title='Evolução Parâmetros' path='/visualize-longitudinal/params-evolution' />
                </SideBarItem>
                <SideBarItem title='Exportar' icon={faDownload} path='/export' />
                <SideBarItem title='Importar' icon={faUpload} path='/import' />
                { ctx && ctx.session.role === 'admin' && 
                    <SideBarItem title='Gerir Utilizadores' icon={faUserGear} path='/user-management'/>
                }
            </Nav>
        </div>
    )
}
