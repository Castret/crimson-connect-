import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-page">
      <div className="auth-card glass-panel">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
