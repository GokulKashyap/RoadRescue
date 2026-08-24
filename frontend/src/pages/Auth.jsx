import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Wrench, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        
        if (res.data.role === 'PROVIDER') navigate('/provider');
        else navigate('/customer');
      } else {
        await api.post('/auth/register', {
          ...formData,
          role: role
        });
        setIsLogin(true); // switch to login after successful register
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center min-h-screen">
      <div className="container" style={{ maxWidth: '480px' }}>
        
        <div className="text-center animate-fade-in" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            <Car size={32} />
            <Wrench size={32} />
          </div>
          <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>RoadRescue</h1>
          <p style={{ color: 'var(--text-muted)' }}>On-demand roadside assistance</p>
        </div>

        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', animationDelay: '0.1s' }}>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              className={`btn btn-full ${isLogin ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {setIsLogin(true); setError('');}}
            >
              Login
            </button>
            <button 
              className={`btn btn-full ${!isLogin ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {setIsLogin(false); setError('');}}
            >
              Register
            </button>
          </div>

          {!isLogin && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
              <button 
                className={`btn btn-full ${role === 'CUSTOMER' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px' }}
                onClick={() => setRole('CUSTOMER')}
              >
                <Car size={18} /> Driver
              </button>
              <button 
                className={`btn btn-full ${role === 'PROVIDER' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px' }}
                onClick={() => setRole('PROVIDER')}
              >
                <Truck size={18} /> Provider
              </button>
            </div>
          )}

          {error && (
            <div style={{ padding: '12px', background: error.includes('successful') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: error.includes('successful') ? 'var(--secondary)' : 'var(--danger)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                required 
                placeholder="you@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                className="input-field" 
                required 
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {!isLogin && role === 'PROVIDER' && (
              <div className="input-group animate-fade-in">
                <label>Company Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  placeholder="Joe's Towing & Repair"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
