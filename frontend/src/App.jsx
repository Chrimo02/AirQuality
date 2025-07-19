// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EnvironmentList from './pages/EnvironmentList';
import Dashboard from './pages/Dashboard';
import SessionDetail from './components/SessionDetail';

export default function App() {
  return (
    <BrowserRouter>
      <header className="bg-white shadow-md py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-semibold text-gray-800">Air Quality</h1>
      </header>
      <main className="container mx-auto p-6">
        <Routes>
          <Route path="/" element={<Navigate to="/environments" replace />} />
          <Route path="/environments" element={<EnvironmentList />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* SessionDetail direkt – falls du Deep Links brauchst */}
          <Route path="/sessions/:sessionId" element={<SessionDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
