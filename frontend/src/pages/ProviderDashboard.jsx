import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Activity } from 'lucide-react';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="container min-h-screen">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="title-gradient">Provider Dashboard</h2>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <Activity size={48} color="var(--secondary)" style={{ margin: '0 auto 1rem' }} />
        <h3>Waiting for Requests...</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You are currently online. When a customer nearby requests assistance, it will appear here.</p>
        
        <button className="btn btn-secondary">
          Go Offline
        </button>
      </div>
    </div>
  );
}
