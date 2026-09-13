import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Activity, Power, PowerOff, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';
import { Client } from '@stomp/stompjs';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeJob, setActiveJob] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchActiveJob();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const client = new Client({
      brokerURL: 'ws://localhost:8081/ws',
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log("Connected to Provider WebSocket");
        client.subscribe('/topic/provider/requests', (message) => {
          // A new request was broadcasted. Refresh the list!
          fetchPendingRequests();
        });
      }
    });
    client.activate();

    return () => client.deactivate();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/providers/me');
      setIsOnline(res.data.available);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveJob = async () => {
    try {
      const res = await api.get('/requests/active');
      if (res.data && res.data.id && res.data.status !== 'COMPLETED' && res.data.status !== 'CANCELLED') {
        setActiveJob(res.data);
      } else {
        setActiveJob(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/requests/pending');
      setPendingRequests(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await api.post(`/providers/status?available=${newStatus}`);
      setIsOnline(newStatus);
      if (newStatus) {
        fetchPendingRequests();
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleAcceptJob = async (id) => {
    try {
      await api.post(`/requests/${id}/accept`);
      fetchActiveJob();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept job');
      fetchPendingRequests(); // refresh list, maybe it was taken
    }
  };

  return (
    <div className="container min-h-screen">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="title-gradient">Provider Dashboard</h2>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      {activeJob ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <CheckCircle size={48} color="var(--secondary)" style={{ margin: '0 auto 1rem' }} />
            <h3>Active Job!</h3>
            <p style={{ color: 'var(--text-muted)' }}>You have accepted a request. Please proceed to the location.</p>
          </div>
          
          <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
            <MapContainer center={[activeJob.latitude, activeJob.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[activeJob.latitude, activeJob.longitude]}>
                <Popup>Customer Location</Popup>
              </Marker>
            </MapContainer>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <p><strong>Issue:</strong> {activeJob.issueDescription}</p>
            <p><strong>Status:</strong> {activeJob.status}</p>
            <p><strong>Customer ID:</strong> {activeJob.customer?.id}</p>
          </div>

          <button className="btn btn-secondary btn-full">
            Mark as Completed (Coming Soon)
          </button>
        </div>
      ) : (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>Status: <span style={{ color: isOnline ? 'var(--secondary)' : 'var(--text-muted)' }}>{isOnline ? 'Online' : 'Offline'}</span></h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{isOnline ? 'Broadcasting your availability' : 'You are currently offline'}</p>
            </div>
            <button 
              className={`btn ${isOnline ? 'btn-secondary' : 'btn-primary'}`} 
              onClick={handleToggleOnline}
            >
              {isOnline ? <><PowerOff size={18}/> Go Offline</> : <><Power size={18}/> Go Online</>}
            </button>
          </div>

          {!isOnline ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <PowerOff size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)' }}>Go online to receive incoming requests.</p>
            </div>
          ) : (
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Available Broadcasts ({pendingRequests.length})</h4>
              
              {pendingRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <Activity size={48} color="var(--secondary)" className="animate-spin" style={{ margin: '0 auto 1rem', animationDuration: '3s' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Listening for requests...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingRequests.map(req => (
                    <div key={req.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{req.issueDescription}</strong>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          Location: {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}
                        </p>
                      </div>
                      <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => handleAcceptJob(req.id)}>
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
