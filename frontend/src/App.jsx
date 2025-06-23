// src/App.jsx
import React from 'react';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <>
      <header className="bg-white shadow-md py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-semibold text-gray-800">Air Quality</h1>
      </header>
      <main className="container mx-auto p-6">
        <Dashboard />
      </main>
    </>
  );
}

export default App;
