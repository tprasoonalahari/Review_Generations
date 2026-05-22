import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleToggleMode = (registering: boolean) => {
    setIsRegistering(registering);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      formData.append('client_id', name || 'User');
      
      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      login(response.data.access_token, { email, role: 'viewer' });
      navigate('/workspace');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await api.post('/auth/register', {
        email,
        password,
        role
      });
      setSuccess('Registration successful! You can now log in.');
      setIsRegistering(false);
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-10 bg-surface rounded-2xl shadow-2xl shadow-blue-900/5 border border-white">
        <h2 className="text-3xl font-extrabold text-center text-text mb-8 tracking-tight">
          {isRegistering ? 'Create Account' : 'Review Hub - Orakris'}
        </h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 border border-green-600 text-green-600 px-4 py-2 rounded-lg mb-4 text-sm font-medium">
            {success}
          </div>
        )}

        {isRegistering ? (
          <form onSubmit={handleRegister}>
            <div className="mb-5">
              <label className="block text-text-muted text-sm font-semibold mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 bg-background/50 text-text border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@pubvision.com"
                required
              />
            </div>
            <div className="mb-5">
              <label className="block text-text-muted text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full pl-4 pr-12 py-3 bg-background/50 text-text border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors cursor-pointer flex items-center justify-center p-1.5 rounded-md hover:bg-background/80"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-text-muted text-sm font-semibold mb-2">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="w-full pl-4 pr-12 py-3 bg-background/50 text-text border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors cursor-pointer flex items-center justify-center p-1.5 rounded-md hover:bg-background/80"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-text-muted text-sm font-semibold mb-2">Role</label>
              <select 
                className="w-full px-4 py-3 bg-background/50 text-text border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="viewer">Viewer (Default)</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 cursor-pointer">
              Register
            </button>
            <div className="mt-6 text-center text-sm">
              <span className="text-text-muted">Already have an account? </span>
              <button 
                type="button" 
                className="text-primary font-semibold hover:underline cursor-pointer"
                onClick={() => handleToggleMode(false)}
              >
                Log in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block text-text-muted text-sm font-semibold mb-2">Your Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-background/50 text-text border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div className="mb-5">
              <label className="block text-text-muted text-sm font-semibold mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 bg-background/50 text-text border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@pubvision.com"
                required
              />
            </div>
            <div className="mb-8">
              <label className="block text-text-muted text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full pl-4 pr-12 py-3 bg-background/50 text-text border border-border rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors cursor-pointer flex items-center justify-center p-1.5 rounded-md hover:bg-background/80"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 cursor-pointer">
              Login
            </button>
            <div className="mt-6 text-center text-sm">
              <span className="text-text-muted">Need an account? </span>
              <button 
                type="button" 
                className="text-primary font-semibold hover:underline cursor-pointer"
                onClick={() => handleToggleMode(true)}
              >
                Sign up
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
