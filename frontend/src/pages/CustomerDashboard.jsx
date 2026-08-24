import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, AlertCircle } from 'lucide-react';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="container min-h-screen">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="title-gradient">Customer Dashboard</h2>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
        <h3>Need Roadside Assistance?</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Request help and we'll connect you with a nearby provider immediately.</p>
        
        <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
          <MapPin size={20} /> Request Assistance Now
        </button>
      </div>
    </div>
  );
}
