import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';

import logoImg from '../assets/logo.png';
import resumeSvg from '../assets/Resume-bro.svg';
import kanbanSvg from '../assets/kanban method-pana.svg';
import dashboardSvg from '../assets/Dashboard-cuate.svg';

type AuthView =
  | 'login'
  | 'register'
  | 'forgot-request'
  | 'forgot-verify-otp'
  | 'forgot-new-password';

interface Slide {
  id: number;
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  isBrandSlide?: boolean;
}

const ONBOARDING_SLIDES: Slide[] = [
  {
    id: 0,
    eyebrow: 'CareerTrack',
    title: 'Build your career with clarity.',
    description:
      'Discover opportunities, understand your skill gaps, and keep every application moving forward.',
    isBrandSlide: true,
  },
  {
    id: 1,
    eyebrow: 'Automated Gap Intelligence',
    title: 'Know what the role actually requires.',
    description:
      'Benchmark your CV against active job requirements and identify the skills you should develop next.',
    image: resumeSvg,
  },
  {
    id: 2,
    eyebrow: 'Kanban Workflow',
    title: 'Keep every application on track.',
    description:
      'Move applications through saved, applied, assessment, interview, and decision stages in one workspace.',
    image: kanbanSvg,
  },
  {
    id: 3,
    eyebrow: 'Recruitment Insights',
    title: 'Turn your applications into insight.',
    description:
      'Understand conversion rates, pipeline health, and the technologies appearing most often in your target roles.',
    image: dashboardSvg,
  },
];

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */

const EyeIcon = () => (
  <svg
    className="h-[17px] w-[17px]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    className="h-[17px] w-[17px]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      d="M9.878 9.878a3 3 0 104.243 4.243"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      d="M3 3l18 18"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M19 12H5M12 19l-7-7 7-7"
    />
  </svg>
);

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export const Auth = () => {
  const { login } = useAuth();

  const [view, setView] = useState<AuthView>('login');
  const [activeSlide, setActiveSlide] = useState(0);

  /* Form fields */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /* Password visibility */
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* Feedback */
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  /* Password validation */
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNum = /[0-9]/.test(newPassword);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const isPasswordValid =
    hasMinLen &&
    hasUpper &&
    hasLower &&
    hasNum &&
    passwordsMatch;

  const currentSlide = ONBOARDING_SLIDES[activeSlide];

  /* ------------------------------------------------------------------------ */
  /* Slideshow                                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                   */
  /* ------------------------------------------------------------------------ */

  const clearFeedback = () => {
    setError('');
    setSuccess('');
  };

  const changeView = (nextView: AuthView) => {
    clearFeedback();
    setView(nextView);
  };

  const getServerMessage = (err: any) => {
    const serverMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Something went wrong. Please try again.';

    return typeof serverMsg === 'string'
      ? serverMsg
      : JSON.stringify(serverMsg);
  };

  /* ------------------------------------------------------------------------ */
  /* Login / Register                                                          */
  /* ------------------------------------------------------------------------ */

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();

    clearFeedback();
    setLoading(true);

    const isRegister = view === 'register';

    const endpoint = isRegister
      ? '/auth/register'
      : '/auth/login';

    const payload = isRegister
      ? {
          name: name.trim(),
          email: email.trim(),
          password,
        }
      : {
          email: email.trim(),
          password,
        };

    try {
      const res = await api.post(endpoint, payload);

      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(getServerMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Forgot password                                                           */
  /* ------------------------------------------------------------------------ */

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();

    clearFeedback();
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', {
        email: email.trim(),
      });

      setSuccess(res.data.message);
      setView('forgot-verify-otp');
    } catch (err: any) {
      setError(getServerMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();

    clearFeedback();
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: otp.trim(),
      });

      setSuccess(res.data.message);
      setView('forgot-new-password');
    } catch (err: any) {
      setError(getServerMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    clearFeedback();

    if (!isPasswordValid) {
      setError(
        'Please fulfill all password requirements before proceeding.'
      );
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
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: any) {
      setError(getServerMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Shared form styles                                                        */
  /* ------------------------------------------------------------------------ */

  const inputClass =
    'w-full rounded-lg border border-[#E3E5E2] bg-white px-3.5 py-3 text-sm text-[#202124] outline-none transition-all placeholder:text-[#A1A6A3] hover:border-[#CDD2CE] focus:border-[#2457A6] focus:ring-4 focus:ring-[#2457A6]/8';

  const buttonClass =
    'w-full rounded-lg bg-[#173F35] py-3 text-sm font-medium text-white transition-all hover:bg-[#12362E] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#202124]">
      <div className="min-h-screen lg:grid lg:grid-cols-[1.15fr_0.85fr]">

        {/* ================================================================== */}
        {/* LEFT / PRODUCT SHOWCASE                                             */}
        {/* ================================================================== */}

        <section className="relative hidden min-h-screen overflow-hidden bg-[#F7F7F5] lg:flex">

          {/* Subtle background decoration */}
          <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#EAF4EF]/70 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-48 right-0 h-[500px] w-[500px] rounded-full bg-[#EAF1FB]/50 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col px-12 py-10 xl:px-16">

            {/* Brand */}
            <div className="flex items-center">
              <img
                src={logoImg}
                alt="CareerTrack"
                className="h-12 w-auto max-w-[150px] object-contain object-left mix-blend-multiply"
              />
            </div>

            {/* Main showcase */}
            <div className="flex flex-1 items-center">

              <div className="w-full max-w-[760px]">

                {/* Eyebrow */}
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-7 bg-[#173F35]" />

                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#58756D]">
                    {currentSlide.eyebrow}
                  </span>
                </div>

                {/* Heading */}
                <h1 className="max-w-xl text-[42px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#173F35] xl:text-[48px]">
                  {currentSlide.title}
                </h1>

                {/* Description */}
                <p className="mt-5 max-w-lg text-[15px] leading-7 text-[#66736D]">
                  {currentSlide.description}
                </p>

                {/* Visual */}
                <div className="relative mt-10 flex h-[330px] w-full items-center justify-center overflow-hidden rounded-2xl border border-[#E4E7E3] bg-white/80 shadow-[0_18px_50px_rgba(23,63,53,0.06)]">

                  {/* Soft visual background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[#F0F6F2]" />

                  {/* Decorative dots */}
                  <div className="absolute right-6 top-6 grid grid-cols-4 gap-1.5 opacity-30">
                    {Array.from({ length: 16 }).map((_, index) => (
                      <span
                        key={index}
                        className="h-1 w-1 rounded-full bg-[#173F35]"
                      />
                    ))}
                  </div>

                  {currentSlide.isBrandSlide ? (
                    <div className="relative flex flex-col items-center justify-center">

                      <div className="absolute h-44 w-44 rounded-full bg-[#EAF4EF] blur-2xl" />

                      <img
                        src={logoImg}
                        alt="CareerTrack Logo"
                        className="relative z-10 h-auto w-[320px] max-w-[70%] object-contain mix-blend-multiply"
                      />

                      <div className="relative z-10 mt-5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#7A8882]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2F7D5C]" />
                        Discover · Apply · Track · Improve
                      </div>
                    </div>
                  ) : (
                    <img
                      src={currentSlide.image}
                      alt={currentSlide.title}
                      className="relative z-10 h-[285px] w-[88%] object-contain transition-all duration-700"
                    />
                  )}
                </div>

                {/* Bottom slide navigation */}
                <div className="mt-7 flex items-center justify-between">

                  <div className="flex items-center gap-2">
                    {ONBOARDING_SLIDES.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                        aria-label={`Show ${slide.eyebrow}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeSlide === index
                            ? 'w-8 bg-[#173F35]'
                            : 'w-1.5 bg-[#C6CEC9] hover:bg-[#879790]'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-[11px] text-[#8A938F]">
                    {String(activeSlide + 1).padStart(2, '0')} / 04
                  </span>

                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-[#929A96]">
              <span>CareerTrack · මඟ</span>
              <span>Your path forward.</span>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* RIGHT / AUTH                                                        */}
        {/* ================================================================== */}

        <section className="flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-14 xl:px-20">

          <div className="w-full max-w-[390px]">

            {/* Mobile brand */}
            <div className="mb-10 flex justify-center lg:hidden">
              <img
                src={logoImg}
                alt="CareerTrack"
                className="h-14 w-auto max-w-[170px] object-contain mix-blend-multiply"
              />
            </div>

            {/* ================================================================ */}
            {/* LOGIN / REGISTER                                                 */}
            {/* ================================================================ */}

            {(view === 'login' || view === 'register') && (
              <>
                <div className="mb-8">

                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#58756D]">
                    {view === 'login'
                      ? 'Welcome back'
                      : 'Get started'}
                  </p>

                  <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[#173F35]">
                    {view === 'login'
                      ? 'Sign in to CareerTrack'
                      : 'Create your CareerTrack account'}
                  </h2>

                  <p className="mt-2.5 text-sm leading-6 text-[#707873]">
                    {view === 'login'
                      ? 'Continue managing your applications, skills, and career progress.'
                      : 'Set up your career workspace and start tracking opportunities.'}
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-lg border border-[#F0CACA] bg-[#FDF4F4] px-3.5 py-3 text-xs leading-5 text-[#A84242]">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-5 rounded-lg border border-[#CDE4D8] bg-[#F2F9F5] px-3.5 py-3 text-xs leading-5 text-[#276A4A]">
                    {success}
                  </div>
                )}

                <form
                  onSubmit={handleAuthSubmit}
                  className="space-y-5"
                >

                  {view === 'register' && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#39433F]">
                        Full Name
                      </label>

                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        placeholder="ABC Perera"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#39433F]">
                      Email address
                    </label>

                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-xs font-medium text-[#39433F]">
                        Password
                      </label>

                      {view === 'login' && (
                        <button
                          type="button"
                          onClick={() => changeView('forgot-request')}
                          className="text-[11px] text-[#68746F] transition-colors hover:text-[#173F35]"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-11`}
                        placeholder="Enter your password"
                        autoComplete={
                          view === 'login'
                            ? 'current-password'
                            : 'new-password'
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => !prev)
                        }
                        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#9AA39F] transition-colors hover:text-[#45514B]"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOffIcon />
                        ) : (
                          <EyeIcon />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`${buttonClass} mt-1`}
                  >
                    {loading
                      ? 'Please wait...'
                      : view === 'login'
                        ? 'Sign in'
                        : 'Create account'}
                  </button>

                  {/* Divider */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#ECEDEA]" />
                    </div>

                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-[11px] text-[#A1A7A3]">
                        or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google */}
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#E1E4E1] bg-white py-3 text-sm font-medium text-[#3E4743] transition-all hover:border-[#CBD1CD] hover:bg-[#FAFBFA]"
                  >
                    <svg
                      className="h-[17px] w-[17px]"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>

                    Continue with Google
                  </button>

                  {/* Switch */}
                  <p className="pt-3 text-center text-xs text-[#747D79]">
                    {view === 'login'
                      ? 'New to CareerTrack?'
                      : 'Already have an account?'}{' '}

                    <button
                      type="button"
                      onClick={() =>
                        changeView(
                          view === 'login'
                            ? 'register'
                            : 'login'
                        )
                      }
                      className="font-medium text-[#173F35] underline decoration-[#B8C7C0] underline-offset-2 hover:decoration-[#173F35]"
                    >
                      {view === 'login'
                        ? 'Create an account'
                        : 'Sign in'}
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* ================================================================ */}
            {/* FORGOT PASSWORD - EMAIL                                          */}
            {/* ================================================================ */}

            {view === 'forgot-request' && (
              <form
                onSubmit={handleRequestOtp}
                className="space-y-5"
              >

                <button
                  type="button"
                  onClick={() => changeView('login')}
                  className="mb-4 flex items-center gap-1.5 text-xs text-[#727B76] transition-colors hover:text-[#173F35]"
                >
                  <ArrowLeftIcon />
                  Back to sign in
                </button>

                <div className="mb-8">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#58756D]">
                    Account recovery
                  </p>

                  <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[#173F35]">
                    Reset your password
                  </h2>

                  <p className="mt-2.5 text-sm leading-6 text-[#707873]">
                    Enter your registered email address and we'll send you a 6-digit verification code.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-[#F0CACA] bg-[#FDF4F4] px-3.5 py-3 text-xs text-[#A84242]">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg border border-[#CDE4D8] bg-[#F2F9F5] px-3.5 py-3 text-xs text-[#276A4A]">
                    {success}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#39433F]">
                    Account email
                  </label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={buttonClass}
                >
                  {loading
                    ? 'Sending code...'
                    : 'Send verification code'}
                </button>
              </form>
            )}

            {/* ================================================================ */}
            {/* FORGOT PASSWORD - OTP                                            */}
            {/* ================================================================ */}

            {view === 'forgot-verify-otp' && (
              <form
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >

                <button
                  type="button"
                  onClick={() => changeView('forgot-request')}
                  className="mb-4 flex items-center gap-1.5 text-xs text-[#727B76] transition-colors hover:text-[#173F35]"
                >
                  <ArrowLeftIcon />
                  Change email
                </button>

                <div className="mb-8">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#58756D]">
                    Verification
                  </p>

                  <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[#173F35]">
                    Check your email
                  </h2>

                  <p className="mt-2.5 text-sm leading-6 text-[#707873]">
                    Enter the 6-digit verification code sent to{' '}
                    <strong className="font-medium text-[#3D4742]">
                      {email}
                    </strong>
                    .
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-[#F0CACA] bg-[#FDF4F4] px-3.5 py-3 text-xs text-[#A84242]">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#39433F]">
                    Verification code
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6)
                      )
                    }
                    className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className={buttonClass}
                >
                  {loading
                    ? 'Checking code...'
                    : 'Verify code'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => changeView('login')}
                    className="text-xs text-[#727B76] underline underline-offset-2 hover:text-[#173F35]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ================================================================ */}
            {/* FORGOT PASSWORD - NEW PASSWORD                                   */}
            {/* ================================================================ */}

            {view === 'forgot-new-password' && (
              <form
                onSubmit={handleResetPassword}
                className="space-y-5"
              >

                <div className="mb-8">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#58756D]">
                    Final step
                  </p>

                  <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[#173F35]">
                    Create a new password
                  </h2>

                  <p className="mt-2.5 text-sm leading-6 text-[#707873]">
                    Choose a secure password for your CareerTrack account.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-[#F0CACA] bg-[#FDF4F4] px-3.5 py-3 text-xs text-[#A84242]">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#39433F]">
                    New password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showNewPassword
                          ? 'text'
                          : 'password'
                      }
                      required
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      className={`${inputClass} pr-11`}
                      placeholder="Create a password"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword((prev) => !prev)
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#9AA39F] hover:text-[#45514B]"
                      aria-label="Toggle new password visibility"
                    >
                      {showNewPassword ? (
                        <EyeOffIcon />
                      ) : (
                        <EyeIcon />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#39433F]">
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      required
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      className={`${inputClass} pr-11`}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#9AA39F] hover:text-[#45514B]"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon />
                      ) : (
                        <EyeIcon />
                      )}
                    </button>
                  </div>
                </div>

                {/* Requirements */}
                <div className="rounded-lg border border-[#E7EAE7] bg-[#FAFBFA] p-3.5">
                  <p className="mb-2 text-[11px] font-semibold text-[#45514B]">
                    Password requirements
                  </p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <PasswordRequirement
                      valid={hasMinLen}
                      text="8+ characters"
                    />

                    <PasswordRequirement
                      valid={hasUpper}
                      text="Uppercase letter"
                    />

                    <PasswordRequirement
                      valid={hasLower}
                      text="Lowercase letter"
                    />

                    <PasswordRequirement
                      valid={hasNum}
                      text="One number"
                    />

                    <PasswordRequirement
                      valid={passwordsMatch}
                      text="Passwords match"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPasswordValid}
                  className={buttonClass}
                >
                  {loading
                    ? 'Updating password...'
                    : 'Set new password'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => changeView('login')}
                    className="text-xs text-[#727B76] underline underline-offset-2 hover:text-[#173F35]"
                  >
                    Cancel and sign in
                  </button>
                </div>
              </form>
            )}

          </div>
        </section>
      </div>
    </main>
  );
};

/* -------------------------------------------------------------------------- */
/* Password requirement                                                        */
/* -------------------------------------------------------------------------- */

const PasswordRequirement = ({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) => (
  <div
    className={`flex items-center gap-1.5 ${
      valid
        ? 'text-[#2F7D5C]'
        : 'text-[#9AA19D]'
    }`}
  >
    <span
      className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] ${
        valid
          ? 'bg-[#EAF4EF]'
          : 'bg-[#EEF0EE]'
      }`}
    >
      {valid ? '✓' : '•'}
    </span>

    <span>{text}</span>
  </div>
);
