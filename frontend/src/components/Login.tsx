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
      <div className="w-full max-w-md p-10 bg-surface rounded-2xl shadow-2xl shadow-blue-900/5 border border-white">
        <h2 className="text-3xl font-extrabold text-center text-text mb-8 tracking-tight">Review & Hub</h2>
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label className="block text-text-muted text-sm font-semibold mb-2">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 bg-background/50 text-text border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-text-muted text-sm font-semibold mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-background/50 text-text border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-200">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
