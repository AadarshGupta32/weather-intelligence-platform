/**
 * App.jsx - Main Application Component
 * Wraps dashboard in Global AppProvider
 */
import React from 'react';
import { AppProvider } from './context/AppContext.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
    return (
        <AppProvider>
            <DashboardPage />
        </AppProvider>
    );
}
