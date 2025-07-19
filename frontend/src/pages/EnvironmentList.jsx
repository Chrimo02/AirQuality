// src/pages/EnvironmentList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEnvironments } from '../services/api';

export default function EnvironmentList() {
  const [envs, setEnvs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEnvironments().then(setEnvs);
  }, []);

  return (
    <main className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Räume</h2>
      <ul className="space-y-2">
        {envs.map(e => (
          <li key={e.id}>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-left bg-white border rounded px-4 py-3 hover:bg-cyan-50"
            >
              {e.name}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
