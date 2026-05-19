import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      // We don't get the user obj from login directly in this setup, 
      // but AuthContext decodes the JWT to get email and role.
      login(response.data.access_token, { email, role: 'viewer' }); // Role will be updated by JWT decode
      navigate('/workspace');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-surface rounded-lg shadow-xl border border-border">
        <h2 className="text-2xl font-bold text-center text-text mb-6">Review & Hub</h2>
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-text-muted text-sm font-bold mb-2">Email</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 bg-white text-text border border-border rounded focus:outline-none focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-text-muted text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 bg-white text-text border border-border rounded focus:outline-none focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded transition-colors">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
