import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';
import { Client } from '@stomp/stompjs';

// Fix for default Leaflet icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [activeRequest, setActiveRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultCenter = [40.7128, -74.0060]; // NYC as default

  useEffect(() => {
    fetchActiveRequest();
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) return;

    const client = new Client({
      brokerURL: 'ws://localhost:8081/ws',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log("Connected to WebSocket");
        client.subscribe(`/topic/customer/${userId}/status`, (message) => {
          const updatedRequest = JSON.parse(message.body);
          if (updatedRequest.status !== 'COMPLETED' && updatedRequest.status !== 'CANCELLED') {
            setActiveRequest(updatedRequest);
          } else {
            setActiveRequest(null);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      }
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  const fetchActiveRequest = async () => {
    try {
      const res = await api.get('/requests/active');
      if (res.data && res.data.id && res.data.status !== 'COMPLETED' && res.data.status !== 'CANCELLED') {
        setActiveRequest(res.data);
      } else {
        setActiveRequest(null);
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

  const handleRequestHelp = async () => {
    if (!position) {
      setError('Please tap on the map to set your location.');
      return;
    }
    if (!issueDescription) {
      setError('Please describe your issue.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/requests', {
        latitude: position.lat,
        longitude: position.lng,
        issueDescription
      });
      fetchActiveRequest();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-h-screen">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="title-gradient">Customer Dashboard</h2>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      {activeRequest ? (
        <div className="glass-panel animate-fade-in hover-scale" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          {activeRequest.status === 'PENDING' ? (
            <>
              <div className="animate-pulse-soft" style={{ background: 'rgba(59, 130, 246, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Loader2 size={40} className="animate-spin" color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.75rem' }}>Broadcasting Request...</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Searching for nearby providers.</p>
            </>
          ) : (
            <>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>
                <AlertCircle size={40} color="var(--secondary)" />
              </div>
              <h3 style={{ fontSize: '1.75rem' }}>Help is on the way!</h3>
              <p style={{ color: 'var(--secondary)', fontWeight: '600', fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                {activeRequest.provider?.companyName || 'A provider'} is en route.
              </p>
            </>
          )}
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '12px', textAlign: 'left', marginTop: '1rem', border: '1px solid var(--border-color)' }}>
            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--primary)' }}>Issue:</strong> {activeRequest.issueDescription}</p>
            <p><strong style={{ color: 'var(--primary)' }}>Status:</strong> <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>{activeRequest.status}</span></p>
          </div>
        </div>
      ) : (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <AlertCircle size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h3>Need Roadside Assistance?</h3>
            <p style={{ color: 'var(--text-muted)' }}>Tap the map to set your location and describe your issue.</p>
          </div>
          
          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div className="map-container-wrapper dark-map" style={{ height: '350px', marginBottom: '1.5rem' }}>
            <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <LocationPicker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>

          <div className="input-group">
            <label>What's wrong with your vehicle?</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Flat tire, Dead battery, Out of gas..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
            />
          </div>
          
          <button className="btn btn-primary btn-full" onClick={handleRequestHelp} disabled={loading} style={{ marginTop: '1rem', padding: '16px', fontSize: '1.1rem' }}>
            {loading ? <Loader2 className="animate-spin" /> : <><MapPin size={20} /> Request Assistance Now</>}
          </button>
        </div>
      )}
    </div>
  );
}
