import React from 'react';
import ReactDOM from 'react-dom/client';
import { initApp } from 'lib';
import './styles/globals.css';
import { App } from './App';
import { config } from './initConfig';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';

initApp(config).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Router>
        <App />
      </Router>
    </React.StrictMode>
  );
});
