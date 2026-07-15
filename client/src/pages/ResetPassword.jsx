import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
    } else {
      setError('Invalid or missing reset token. Please request a new recovery link.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);

    try {
      const res = await api.post('/api/auth/reset-password', {
        token,
        newPassword
      });
      setMessage(res.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <h2 className="auth-logo">Crimson<span>Connect</span></h2>
        <p>Set a new account password</p>
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
          {message} - Redirecting to login...
        </div>
      )}

      {token && !message && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
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

export default ResetPassword;
