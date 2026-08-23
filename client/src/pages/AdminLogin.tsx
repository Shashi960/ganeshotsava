import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Flame, Lock, Mail, ArrowLeft } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.status === 'success') {
        const { token, admin } = res.data;
        login(token, admin);
        showToast('Login successful! Welcome to the Admin Panel.', 'success');
        navigate('/admin');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Invalid email or password.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white rounded-xl border border-warm-dark p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto shadow">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-primary font-sanskrit">
            Admin Portal Sign In
          </h1>
          <p className="text-xs text-charcoal-light">
            Enter administrative credentials to manage Ganeshotsava data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
              <input
                type="email"
                required
                placeholder="admin@ganeshotsava.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-warm border border-warm-dark rounded-lg pl-9 pr-4 py-2 text-sm text-charcoal outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-warm border border-warm-dark rounded-lg pl-9 pr-4 py-2 text-sm text-charcoal outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-warm font-bold py-2 rounded-lg hover:bg-primary-light transition shadow-md"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-charcoal-light hover:text-primary transition flex items-center gap-1.5 mx-auto font-semibold"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
