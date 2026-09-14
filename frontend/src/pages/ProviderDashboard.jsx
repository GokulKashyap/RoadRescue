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
        const userId = localStorage.getItem('userId');
        console.log("Connected to Provider WebSocket");
        client.subscribe(`/topic/provider/${userId}/requests`, (message) => {
          // A new request was broadcasted to us specifically. Refresh the list!
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
      
      if (newStatus) {
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser');
          return;
        }
        
        navigator.geolocation.getCurrentPosition(async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          await api.post(`/providers/status?available=true&lat=${lat}&lng=${lng}`);
          setIsOnline(true);
          fetchPendingRequests();
        }, (error) => {
          alert('Failed to get location. Please allow location access to go online.');
        });
      } else {
        await api.post(`/providers/status?available=false`);
        setIsOnline(false);
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
          
          <div className="map-container-wrapper dark-map" style={{ height: '350px', marginBottom: '1.5rem' }}>
            <MapContainer center={[activeJob.latitude, activeJob.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
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
              <h3 style={{ marginBottom: '0.25rem' }}>Status: <span style={{ color: isOnline ? 'var(--secondary)' : 'var(--danger)', transition: 'color 0.3s' }}>{isOnline ? 'Online' : 'Offline'}</span></h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{isOnline ? 'Broadcasting your availability' : 'You are currently offline'}</p>
            </div>
            
            <div className="toggle-container" style={{ width: '140px', margin: 0, padding: '4px' }}>
              <div className="toggle-slider" style={{ transform: isOnline ? 'translateX(100%)' : 'translateX(0)', background: isOnline ? 'linear-gradient(135deg, var(--secondary), #34d399)' : 'linear-gradient(135deg, var(--danger), #f87171)', boxShadow: isOnline ? '0 4px 12px rgba(16, 185, 129, 0.4)' : '0 4px 12px rgba(239, 68, 68, 0.4)' }}></div>
              <div className={`toggle-option ${!isOnline ? 'active' : ''}`} onClick={() => { if(isOnline) handleToggleOnline(); }} style={{ fontSize: '0.85rem' }}>
                Offline
              </div>
              <div className={`toggle-option ${isOnline ? 'active' : ''}`} onClick={() => { if(!isOnline) handleToggleOnline(); }} style={{ fontSize: '0.85rem' }}>
                Online
              </div>
            </div>
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
                  {pendingRequests.map((req, index) => (
                    <div key={req.id} className="glass-panel hover-scale" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: `fadeIn 0.5s ease backwards ${(index+1)*0.1}s` }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>{req.issueDescription}</strong>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} color="var(--primary)" /> 
                          {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}
                        </p>
                      </div>
                      <button className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '20px' }} onClick={() => handleAcceptJob(req.id)}>
                        Accept Job
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
