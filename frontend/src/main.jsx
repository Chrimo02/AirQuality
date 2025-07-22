// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';


try {
  if (typeof window !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env) {
    window.__VITE_ENV__ = import.meta.env;
  }
} catch {
  
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
