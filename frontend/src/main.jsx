/**
 * main.jsx - React 19 Application Entrypoint
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import 'leaflet/dist/leaflet.css';
import './style.css';
import './landing.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
