import React from 'react';
import { Button } from 'react-bootstrap'
import 'chart.js/auto';
import './App.css';

export default function Something() {

    async function clickHandler() {
        try {
          const options = {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            },
          }
          const response = await fetch('http://localhost:8000', options)
          const json = await response.json()
        } catch(error) {
        }
    }
  
  return (
    <div style={{height: '100vh', width:'100vh'}}>
      <Button variant="primary" onClick={() => clickHandler()}>Click me!</Button>
    </div>
    
  );
}

  