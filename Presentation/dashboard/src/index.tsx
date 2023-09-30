import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';

import NavBar from './components/navbars/NavBar'
import ErrorPage from './components/pages/ErrorPage';
import Login from './components/pages/Login'
import Dashboard from './components/pages/Dashboard';
import AuthRequired from './components/AuthRequired';
import Home from './components/pages/Home';
import Logout from './components/Logout';
import Main from './components/Main';
import Export from './components/pages/Export';
import Import from './components/pages/Import';
import VisualizeStatsData from './components/pages/visualizeData/stats/VisualizeStatsData';
import ParamEvolutionData from './components/pages/visualizeData/longitudinal/paramEvolution/ParamEvolutionData';
import SurvivalCurvesData from './components/pages/visualizeData/longitudinal/survivalCurves/SurvivalCurvesData';
import AdminRequired from './components/AdminRequired';
import UserManagement from './components/pages/management/userManagement/UserManagement';


// the routes of the application
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Main />} errorElement= {<ErrorPage />}>
      <Route element={<NavBar />}> 
        <Route path='/' element={<Home />} />
        <Route path='login' element={<Login />} />        
        <Route path='logout' element={<Logout />} />
        <Route element={<AuthRequired />} >
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='export' element={<Export />} />
          <Route path='import' element={<Import />} />
          <Route path='visualize-stats' element={<VisualizeStatsData />} />
          <Route path='visualize-longitudinal/survival-curves' element={<SurvivalCurvesData />} />
          <Route path='visualize-longitudinal/params-evolution' element={<ParamEvolutionData />} />
          <Route element={<AdminRequired />} >
            <Route path='user-management' element={<UserManagement />} />
          </Route>
        </Route>
      </Route>
    </Route>
  )
)

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
