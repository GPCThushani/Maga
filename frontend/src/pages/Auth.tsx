import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

type AuthView = 'login' | 'register' | 'forgot-request' | 'forgot-verify-otp' | 'forgot-new-password';

interface Slide {
  id: number;
  tag: string;
  title: string;
  description: string;
  bgColor: string;
  accentText: string;
  isBrandSlide?: boolean;
}

const ONBOARDING_SLIDES: Slide[] = [
  {
    id: 0,
    tag: 'Deterministic Career Engine',
    title: 'Maga Internship Hub',
    description:
      'Unleash your career potential with factual skill verification and structured recruitment tracking.',
    bgColor: 'bg-[#EBF8F2]',
    accentText: 'text-emerald-800',
    isBrandSlide: true,
  },
  {
    id: 1,
    tag: 'Automated Gap Intelligence',
    title: 'Targeted CV Analysis',
    description:
      'Benchmark your parsed resume against active job requirements to pinpoint missing prerequisite skills.',
    bgColor: 'bg-[#FFF7ED]',
    accentText: 'text-amber-800',
  },
  {
    id: 2,
    tag: 'Kanban Workflow',
    title: 'Structured Pipeline Board',
    description:
      'Track applications across every stage from Initial Application to Technical Assessments and Final Decision.',
    bgColor: 'bg-[#F0F7FF]',
    accentText: 'text-blue-800',
  },
  {
    id: 3,
    tag: 'Recruitment Insights',
    title: 'Conversion & Skill Metrics',
    description:
      'Monitor stage velocity and identify the most in-demand technologies across the software industry.',
    bgColor: 'bg-[#FAF5FF]',
    accentText: 'text-purple-800',
  },
];

// Eye icon components for show/hide toggles
const EyeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
);

export const Auth = () => {
  const { login } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [activeSlide, setActiveSlide] = useState(0);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Password Validation Checks
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNum = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNum && passwordsMatch;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const isRegister = view === 'register';
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(res.data.message);
      setView('forgot-verify-otp');
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: otp.trim(),
      });
      setSuccess(res.data.message);
      setView('forgot-new-password');
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordValid) {
      setError('Please fulfill all password requirements before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccess(res.data.message);
      setView('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
    } finally {
      setLoading(false);
    }
  };

  const currentSlide = ONBOARDING_SLIDES[activeSlide];

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* LEFT SIDE: Dynamic Showcase */}
      <div
        className={`hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden transition-colors duration-700 ${currentSlide.bgColor}`}
      >
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            {currentSlide.id === 0 && (
              <div className="absolute inset-0 rounded-full border-[4px] border-emerald-500/80 shadow-sm" />
            )}
            {currentSlide.id === 1 && (
              <div className="absolute inset-0 rounded-full border-[4px] border-l-amber-500 border-t-amber-500 border-r-transparent border-b-transparent -rotate-12 transition-transform duration-700" />
            )}
            {currentSlide.id === 2 && (
              <div className="absolute inset-0 rounded-full border-[4px] border-dashed border-blue-500 rotate-45 transition-transform duration-700" />
            )}
            {currentSlide.id === 3 && (
              <div className="absolute inset-0 rounded-full border-t-[4px] border-b-[4px] border-purple-500 border-l-transparent border-r-transparent transition-all duration-700" />
            )}

            <div className="w-52 h-52 rounded-full bg-white/90 shadow-sm flex flex-col items-center justify-center p-6 backdrop-blur-xs transition-all duration-500">
              {currentSlide.isBrandSlide ? (
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-2xl mb-2 shadow-xs">
                    M
                  </div>
                  <span className="text-[11px] text-emerald-800 font-semibold tracking-wide">
                    [ Primary Logo ]
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-14 w-14 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
                    <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.75" />
                      <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.75" />
                      <path d="M21 15l-5-5L5 21" strokeWidth="1.75" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 max-w-[130px]">
                    [ Feature Graphic {currentSlide.id} ]
                  </span>
                </div>
              )}
            </div>
          </div>

          <span className={`text-[11px] font-semibold uppercase tracking-wider mb-2 transition-colors duration-500 ${currentSlide.accentText}`}>
            {currentSlide.tag}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 min-h-[2rem]">
            {currentSlide.title}
          </h2>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-xs min-h-[3rem]">
            {currentSlide.description}
          </p>

          <div className="flex items-center gap-2 mt-8">
            {ONBOARDING_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  activeSlide === idx ? 'h-2 w-6 bg-slate-800' : 'h-2 w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Container */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 sm:px-12 md:px-20 py-12">
        <div className="w-full max-w-sm">
          {/* Logo Placeholder */}
          <div className="mb-6 flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center font-bold text-slate-900 text-lg shadow-xs mb-1.5">
              M
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              [ Application Logo ]
            </span>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-2.5 text-xs text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700">
              {success}
            </div>
          )}

          {/* 1. SIGN IN / REGISTER FORM */}
          {(view === 'login' || view === 'register') && (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {view === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-800 focus:outline-none"
                    placeholder="ABC Perera"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Username or email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-800 focus:outline-none"
                  placeholder="username@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-800 focus:border-slate-800 focus:outline-none"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {view === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccess('');
                      setView('forgot-request');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#1F2937] py-2.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50 mt-2"
              >
                {loading ? 'Please wait...' : view === 'login' ? 'Sign in' : 'Create Account'}
              </button>

              <div className="relative my-5 flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="bg-white px-3 text-[11px] text-slate-400">or</span>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign in with Google
              </button>

              <div className="pt-4 text-center text-xs text-slate-500">
                {view === 'login' ? (
                  <>
                    Are you new?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccess('');
                        setView('register');
                      }}
                      className="font-medium text-slate-900 underline hover:text-black"
                    >
                      Create an Account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccess('');
                        setView('login');
                      }}
                      className="font-medium text-slate-900 underline hover:text-black"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </form>
          )}

          {/* 2. FORGOT PASSWORD: STEP 1 (EMAIL REQUEST) */}
          {view === 'forgot-request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Reset Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered email address to receive a 6-digit verification code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-800 focus:outline-none"
                  placeholder="username@gmail.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#1F2937] py-2.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setView('login');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD: STEP 2 (VERIFY OTP ONLY) */}
          {view === 'forgot-verify-otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Verify Code</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the 6-digit code sent for <strong className="text-slate-700">{email}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  className="w-full tracking-widest text-center font-mono rounded-md border border-slate-200 px-3 py-2 text-base text-slate-800 focus:border-slate-800 focus:outline-none"
                  placeholder="123456"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-md bg-[#1F2937] py-2.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50"
              >
                {loading ? 'Checking Code...' : 'Verify OTP'}
              </button>

              <div className="flex justify-between items-center pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setView('forgot-request')}
                  className="text-slate-500 hover:text-slate-800 underline"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setView('login');
                  }}
                  className="text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD: STEP 3 (NEW PASSWORD & REQUIREMENTS) */}
          {view === 'forgot-new-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Set New Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose a secure password for your account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-800 focus:border-slate-800 focus:outline-none"
                    placeholder="New password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-800 focus:border-slate-800 focus:outline-none"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="rounded-md bg-slate-50 p-3 border border-slate-100 text-[11px] space-y-1">
                <p className="font-semibold text-slate-600 mb-1.5">Password Requirements:</p>
                <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span>{hasMinLen ? '✓' : '•'}</span> At least 8 characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span>{hasUpper ? '✓' : '•'}</span> At least one uppercase letter (A-Z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span>{hasLower ? '✓' : '•'}</span> At least one lowercase letter (a-z)
                </div>
                <div className={`flex items-center gap-1.5 ${hasNum ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span>{hasNum ? '✓' : '•'}</span> At least one number (0-9)
                </div>
                <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span>{passwordsMatch ? '✓' : '•'}</span> Passwords match
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full rounded-md bg-[#1F2937] py-2.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Set New Password'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setView('login');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel and Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};