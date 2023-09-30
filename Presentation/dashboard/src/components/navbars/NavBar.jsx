import { useEffect } from 'react'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import '../../utils/styles.css'

import { Outlet, Link, useOutletContext } from 'react-router-dom'

import { LOGOUT_PATH } from '../../utils/paths';
import { faPowerOff, faVirusCovid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export default function NavBar() {
  const [ctx, setCtx, loginState] = useOutletContext()

  useEffect(() => {

    async function logout(ev) {
      ev.preventDefault()
      const configObj = {
          method: 'POST',
          credentials: 'include',
      }

      try {
          const resp = await fetch(LOGOUT_PATH, configObj)
          const json = await resp.json()
      } catch(error) {
      }
      
  }

    window.addEventListener('beforeUnload', logout)
  }, [])

  return (
    <div>
      <Navbar collapseOnSelect expand="lg" variant="dark" className='nb-main' >
        <Container>
          <Navbar.Brand className='nb-link' href="/">
            <FontAwesomeIcon style={{paddingRight: '0.3rem'}} size="lg" icon={faVirusCovid} />
            Premo Dashboard
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="me-auto" />
              <Nav>
                {ctx 
                  ? <Link to="/logout" className='nb-link'> Encerrar Sessão <FontAwesomeIcon style={{paddingRight: '0.3rem'}} size="lg" icon={faPowerOff} /> </Link> 
                  : <Link className='nb-link' to="/login">Iniciar Sessão</Link> }            
              </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div style={{marginTop: '70px'}}>
        <Outlet context={[ctx, setCtx, loginState]} />
      </div>
      
    </div>
  )
}