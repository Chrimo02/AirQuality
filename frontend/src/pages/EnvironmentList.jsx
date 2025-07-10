// src/pages/EnvironmentList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEnvironments, createEnvironment } from '../services/api';

export default function EnvironmentList() {
  const [envs, setEnvs] = useState([]);
  const [newName, setNewName] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    fetchEnvironments().then(setEnvs);
  }, []);

  const addEnv = async () => {
    if (!newName) return;
    const created = await createEnvironment(newName);
    setEnvs(e => [created, ...e]);
    setNewName('');
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Räume verwalten</h2>
      <div className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Neuer Raum"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={addEnv}
          className="bg-cyan-400 text-white rounded px-4 py-2"
        >
          Hinzufügen
        </button>
      </div>
      <ul className="space-y-2">
        {envs.map(env => (
          <li key={env.id}>
            <button
              onClick={() => nav(`/environments/${env.id}`)}
              className="w-full text-left bg-white border rounded px-4 py-3 hover:bg-cyan-50"
            >
              {env.name}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
