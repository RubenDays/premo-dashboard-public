import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Nav from 'react-bootstrap/Nav';
import { useState } from "react"


export default function SideBarItem({ icon, title, path, spacing=0, children }) {
    const [isOpen, setOpen] = useState(false)

    const space = spacing * 45

    if (children) {
        return (
            <div className={isOpen ? "sidebar-item open" : "sidebar-item"} style={{paddingLeft: `${space}px`}}>
                <div className="sidebar-title">
                    <Link className='sb-link' onClick={() => setOpen(!isOpen)} to={'#'}>
                        {icon ? <FontAwesomeIcon style={{paddingRight: '0.3rem'}} size="2x" icon={icon} /> : <></>}
                        {title}
                    </Link>
                    <i className="bi-chevron-down toggle-btn" onClick={() => setOpen(!isOpen)}></i>
                </div>          
                <div className="sidebar-content">
                    { children.map((child, index) => 
                        <SideBarItem key={index} 
                            icon={child.props.icon}
                            title={child.props.title}
                            path={child.props.path}
                            children={child.props.children}
                            spacing={spacing + 1}/>) }
                </div>
            </div>
        )
    } else {
        return (
            <Nav.Item className='sb-nav-item' style={{paddingLeft: `${space}px`}}>
                <Link className='sb-link' to={path}>
                    {icon ? <FontAwesomeIcon style={{paddingRight: '0.3rem'}} size="2x" icon={icon} /> : <></>}
                    {title}
                </Link>
            </Nav.Item>
            
        )
    }

    
}