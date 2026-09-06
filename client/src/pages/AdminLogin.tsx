import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Flame, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please enter both username/email and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      if (res.data.status === 'success') {
        const { token, admin } = res.data;
        login(token, admin);
        showToast('Login successful! Welcome to the Admin Panel.', 'success');
        navigate('/admin');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Invalid username/email or password.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white rounded-2xl border border-warm-dark p-8 shadow-lg space-y-6">
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
            <label className="text-xs font-bold text-charcoal block">
              Username or Email (ಬಳಕೆದಾರರ ಹೆಸರು ಅಥವಾ ಇಮೇಲ್)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="superadmin or admin@ganeshotsava.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-warm border border-warm-dark rounded-xl pl-9 pr-4 py-2.5 text-sm text-charcoal outline-none focus:border-accent font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal block">
              Password (ಪಾಸ್ವರ್ಡ್)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-warm border border-warm-dark rounded-xl pl-9 pr-10 py-2.5 text-sm text-charcoal outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-charcoal-light hover:text-charcoal transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-warm font-bold py-2.5 rounded-xl hover:bg-primary-light transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>



        <div className="text-center pt-1">
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