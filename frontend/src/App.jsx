// src/App.jsx
import React from 'react';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <>
      <header>
        <h1>Smart-Home Dashboard</h1>
      </header>
      <main className="container">
        <Dashboard />
      </main>
    </>
  );
}

export default App;
