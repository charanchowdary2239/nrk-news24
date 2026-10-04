'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  X,
  KeyRound
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Logged in successfully, navigate to dashboard
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      setError('Network communication error during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2 mb-4">
          <span className="bg-red-600 text-white font-black text-2xl px-3 py-1 rounded-sm shadow-md">
            NRK
          </span>
          <span className="text-3xl font-black tracking-tight text-white font-display">
            NEWS24
          </span>
        </Link>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Editorial Management System
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Authorized Newsroom Administrators & Editors Only
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-sm sm:px-10 border border-slate-700">
          {error && (
            <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Editorial Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@nrknews24.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-sm text-sm text-slate-900 focus:outline-none focus:border-[#0b2545] focus:ring-1 focus:ring-[#0b2545]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-medium text-slate-500 hover:text-[#0b2545] underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-sm text-sm text-slate-900 focus:outline-none focus:border-[#0b2545] focus:ring-1 focus:ring-[#0b2545]"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-sm text-sm font-bold text-white bg-[#0b2545] hover:bg-slate-800 focus:outline-none transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Newsroom'}
                {!loading && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </button>
            </div>
          </form>

          {/* Secure System Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center text-xs text-slate-400 space-x-2">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Encrypted with SHA-256 / Bcrypt • Protected Session</span>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Return to NRK News24 Public Website
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0b2545] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Administrator Recovery</h3>
                <p className="text-xs text-slate-500">Self-hosted Security Procedure</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              For security reasons, NRK News24 admin credentials are not transmitted via external unencrypted email. Default credentials set during installation:
            </p>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded font-mono text-xs text-slate-800 space-y-1 mb-4">
              <div><strong>Email:</strong> admin@nrknews24.com</div>
              <div><strong>Default Key:</strong> Admin@NRK2026!</div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              To reset your administrator credentials at any time, execute the following command in the server console:
            </p>

            <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[11px] select-all mb-4">
              npm run seed
            </div>

            <button
              onClick={() => setForgotModalOpen(false)}
              className="w-full bg-[#0b2545] text-white py-2 rounded text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
