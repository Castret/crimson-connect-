import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
      // For developer testing / presentation ease, we capture and display the token
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <h2 className="auth-logo">Crimson<span>Connect</span></h2>
        <p>Recover your account password</p>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(192, 57, 43, 0.15)', 
          border: '1px solid rgba(192, 57, 43, 0.3)', 
          color: '#e74c3c', 
          padding: '12px', 
          borderRadius: 'var(--border-radius-sm)', 
          marginBottom: '20px',
          fontSize: '0.9rem',
          textAlign: 'left'
        }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ 
          background: 'rgba(46, 204, 113, 0.15)', 
          border: '1px solid rgba(46, 204, 113, 0.3)', 
          color: '#2ecc71', 
          padding: '12px', 
          borderRadius: 'var(--border-radius-sm)', 
          marginBottom: '20px',
          fontSize: '0.9rem',
          textAlign: 'left'
        }}>
          {message}
        </div>
      )}

      {!resetToken ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. donor@crimson.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Submitting request...' : 'Send Recovery Email'}
          </button>
        </form>
      ) : (
        <div style={{ marginTop: '10px', textAlign: 'left' }}>
          <p style={{ marginBottom: '16px', color: '#cbd5e1' }}>
            We've generated a mock recovery token for you to reset your password instantly:
          </p>
          <div className="form-group">
            <label className="form-label">Reset Token</label>
            <input
              type="text"
              className="form-control"
              value={resetToken}
              readOnly
              style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </div>
          <button 
            className="btn btn-gold" 
            style={{ width: '100%', marginTop: '10px' }} 
            onClick={() => navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`)}
          >
            Proceed to Reset Password
          </button>
        </div>
      )}

      <div className="auth-footer">
        Back to{' '}
        <Link to="/login" className="auth-link">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
