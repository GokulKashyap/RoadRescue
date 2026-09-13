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
        localStorage.setItem('userId', res.data.id);
        
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
          
          <div className="toggle-container">
            <div className="toggle-slider" style={{ transform: !isLogin ? 'translateX(100%)' : 'translateX(0)' }}></div>
            <div className={`toggle-option ${isLogin ? 'active' : ''}`} onClick={() => {setIsLogin(true); setError('');}}>
              Login
            </div>
            <div className={`toggle-option ${!isLogin ? 'active' : ''}`} onClick={() => {setIsLogin(false); setError('');}}>
              Register
            </div>
          </div>

          {!isLogin && (
            <div className="toggle-container animate-fade-in stagger-1" style={{ transform: 'scale(0.9)', marginBottom: '1.5rem', marginTop: '-10px' }}>
              <div className="toggle-slider" style={{ transform: role === 'PROVIDER' ? 'translateX(100%)' : 'translateX(0)', background: 'linear-gradient(135deg, var(--secondary), #34d399)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}></div>
              <div className={`toggle-option ${role === 'CUSTOMER' ? 'active' : ''}`} onClick={() => setRole('CUSTOMER')}>
                <Car size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Driver
              </div>
              <div className={`toggle-option ${role === 'PROVIDER' ? 'active' : ''}`} onClick={() => setRole('PROVIDER')}>
                <Truck size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Provider
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '12px', background: error.includes('successful') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: error.includes('successful') ? 'var(--secondary)' : 'var(--danger)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="animate-fade-in stagger-2">
            <div className="input-group">
              <input 
                type="email" 
                className="input-field" 
                required 
                placeholder="you@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
              <label style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--card-bg)', padding: '0 5px', fontSize: '0.75rem' }}>Email Address</label>
            </div>
            
            <div className="input-group">
              <input 
                type="password" 
                className="input-field" 
                required 
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <label style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--card-bg)', padding: '0 5px', fontSize: '0.75rem' }}>Password</label>
            </div>

            {!isLogin && role === 'PROVIDER' && (
              <div className="input-group animate-fade-in stagger-3">
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  placeholder="Joe's Towing & Repair"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
                <label style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--card-bg)', padding: '0 5px', fontSize: '0.75rem' }}>Company Name</label>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1.5rem', padding: '16px' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Secure Sign In' : 'Create Account')}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
