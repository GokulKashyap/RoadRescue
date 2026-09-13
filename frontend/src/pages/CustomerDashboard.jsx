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
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
          {activeRequest.status === 'PENDING' ? (
            <>
              <Loader2 size={48} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
              <h3>Broadcasting Request...</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Waiting for a nearby provider to accept your job.</p>
            </>
          ) : (
            <>
              <AlertCircle size={48} color="var(--secondary)" style={{ margin: '0 auto 1rem' }} />
              <h3>Help is on the way!</h3>
              <p style={{ color: 'var(--secondary)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
                {activeRequest.provider?.companyName || 'A provider'} accepted your request!
              </p>
            </>
          )}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'left', marginTop: '1rem' }}>
            <p><strong>Issue:</strong> {activeRequest.issueDescription}</p>
            <p><strong>Status:</strong> {activeRequest.status}</p>
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

          <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
            <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
