import { useState } from 'react';
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { InteractiveBackground } from './InteractiveBackground';
import { ForgotPassword } from './ForgotPassword';
import { apiFetch } from '../services/api';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
}

export function Auth({ onLoginSuccess }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [view, setView] = useState<'auth' | 'forgot-password' | 'birthday'>('auth');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [profileData, setProfileData] = useState({
    name: '',
    birthday: '',
    gender: '' as 'male' | 'female' | '',
    genderPreference: 'everyone' as 'male' | 'female' | 'everyone'
  });
  const [tempUser, setTempUser] = useState<any>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    gender: '',
    genderPreference: ''
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Show confirm password field when password has content in register mode
  const showConfirmPasswordField = mode === 'register' && formData.password.length > 0;

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return 'A password deve ter pelo menos 8 caracteres.';
    if (!hasUpperCase) return 'A password deve ter pelo menos uma letra maiúscula.';
    if (!hasLowerCase) return 'A password deve ter pelo menos uma letra minúscula.';
    if (!hasNumbers) return 'A password deve ter pelo menos um número.';
    if (!hasSpecialChar) return 'A password deve ter pelo menos um caracter especial.';

    return '';
  };

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'name':
        if (mode === 'register' && !value.trim()) {
          error = 'Nome é obrigatório';
        } else if (mode === 'register' && value.trim().length < 2) {
          error = 'Nome deve ter pelo menos 2 caracteres';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Email inválido';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password é obrigatória';
        } else if (mode === 'register') {
          error = validatePassword(value);
        } else if (value.length < 6) {
          // Login mode simple check
          error = 'Password deve ter pelo menos 6 caracteres';
        }
        break;
      case 'confirmPassword':
        if (mode === 'register' && !value) {
          error = 'Confirmação de password é obrigatória';
        } else if (mode === 'register' && value !== formData.password) {
          error = 'Passwords não coincidem';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field as keyof typeof touched]) {
      validateField(field, value);
    }
    // Also revalidate confirmPassword if password changes
    if (field === 'password' && touched.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    // Clear errors when switching modes
    setErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      birthday: '',
      gender: '',
      genderPreference: ''
    });
    setApiError('');
    setApiSuccess('');
  };

  const processLoginSuccess = (user: any, token?: string) => {
    if (token) {
      localStorage.setItem('authToken', token);
    }
    localStorage.setItem('user', JSON.stringify(user));

    if (!user.birthdate || !user.gender || !user.gender_preference) {
      setTempUser(user);
      // Pre-fill state if some data exists but not all
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        birthday: user.birthdate || '',
        gender: user.gender || '',
        genderPreference: user.gender_preference || 'everyone'
      }));
      setView('birthday');
      setApiSuccess('Almost there! Please tell us your birthday and preferences.');
    } else {
      setApiSuccess('Login success!');
      setTimeout(() => {
        onLoginSuccess(user);
      }, 1000);
    }
  };

  const handleBirthdaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!profileData.name || profileData.name.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'Nome é obrigatório e deve ter pelo menos 2 caracteres' }));
      return;
    }
    if (!profileData.birthday) {
      setErrors(prev => ({ ...prev, birthday: 'Data de nascimento é obrigatória' }));
      return;
    }
    if (!profileData.gender) {
      setErrors(prev => ({ ...prev, gender: 'Género é obrigatório' }));
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/profile', {
        method: 'POST',
        body: JSON.stringify({
          user_id: tempUser.id,
          name: profileData.name,
          birthdate: profileData.birthday,
          gender: profileData.gender,
          gender_preference: profileData.genderPreference
        })
      });

      if (response.status === 'success') {
        const updatedUser = {
          ...tempUser,
          name: profileData.name,
          birthdate: profileData.birthday,
          gender: profileData.gender,
          gender_preference: profileData.genderPreference
        };
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
        setApiSuccess('Profile updated!');
        setTimeout(() => {
          onLoginSuccess(updatedUser);
        }, 1000);
      } else {
        setApiError(response.message || 'Error saving birthday');
      }
    } catch (err) {
      setApiError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');

    // Basic Validation before API call
    const currentErrors = { ...errors };
    let hasErrors = false;

    // Trigger validation for all fields
    Object.keys(formData).forEach(key => {
      if (mode === 'login' && (key === 'name' || key === 'confirmPassword')) return;
      // We would ideally call validateField logic here, but for now rely on existing state if touched
      // But wait, if untouched, errors are empty. Let's do a quick check.
      if (mode === 'register' && key === 'name' && !formData.name) {
        currentErrors.name = 'Nome é obrigatório';
        hasErrors = true;
      }
      if (!formData.email) {
        currentErrors.email = 'Email é obrigatório';
        hasErrors = true;
      }
      if (!formData.password) {
        currentErrors.password = 'Password é obrigatória';
        hasErrors = true;
      } else if (mode === 'register') {
        const passErr = validatePassword(formData.password);
        if (passErr) {
          currentErrors.password = passErr;
          hasErrors = true;
        }
      }
      if (mode === 'register' && key === 'confirmPassword' && formData.password !== formData.confirmPassword) {
        currentErrors.confirmPassword = 'Passwords não coincidem';
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(currentErrors);
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          ...(mode === 'register' && { name: formData.name }),
        }),
      });

      if (data.status === 'success' || data.token) {
        // Save JWT token and user data
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }

        if (mode === 'login') {
          processLoginSuccess(data.user);
        } else {
          // Register success - switch to login mode with email pre-filled
          setApiSuccess(data.message);

          setTimeout(() => {
            handleModeChange('login');
            // Keep email but clear password and name
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '', name: '' }));
          }, 2000);
        }
      } else {
        // Show password errors if they exist
        if (data.errors && Array.isArray(data.errors)) {
          setApiError(data.errors.join('\n'));
        } else {
          setApiError(data.message || 'Ocorreu um erro.');
        }
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      setApiError(error.message || 'Erro de conexão ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  /* Google Login Hook */
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setApiError('');

      try {
        const response = await apiFetch('/login/google', {
          method: 'POST',
          body: JSON.stringify({
            token: tokenResponse.access_token, // Sending Access Token
            type: 'access_token' // Marker for backend
          }),
        });

        if (response.status === 'success') {
          processLoginSuccess(response.user, response.token);
        } else {
          setApiError(response.message || 'Erro no login Google');
        }

      } catch (err: any) {
        console.error('Google Login Error:', err);
        setApiError('Falha ao autenticar com Google');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setApiError('Falha na conexão com Google');
      setIsLoading(false);
    }
  });

  const handleGoogleLogin = async () => {
    if (!Capacitor.isNativePlatform()) {
      loginWithGoogle();
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const login = await SocialLogin.login({
        provider: 'google',
        options: {},
      });
      const idToken = login.result.responseType === 'online' ? login.result.idToken : null;

      const response = await apiFetch('/login/google', {
        method: 'POST',
        body: JSON.stringify({
          token: idToken,
          type: 'id_token'
        }),
      });

      if (response.status === 'success') {
        processLoginSuccess(response.user, response.token);
      } else {
        setApiError(response.message || 'Erro no login Google');
      }
    } catch (err: any) {
      console.error('Google Login Error:', err);
      setApiError('Falha ao autenticar com Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0a0a0a' }}>
      <InteractiveBackground />
      {/* Ambient golden glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(184,134,11,0.1) 0%, transparent 70%)' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo */}
        <div className="mb-12">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
              }}
            >
              <Zap className="w-7 h-7 text-black" fill="black" />
            </div>
            <span
              className="text-3xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              VIBE
            </span>
          </div>
        </div>

        {/* Auth Card */}
        {view === 'forgot-password' ? (
          <ForgotPassword onBack={() => setView('auth')} />
        ) : view === 'birthday' ? (
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="rounded-3xl p-8 md:p-10 relative"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold mb-2 text-white">Complete Your Profile</h2>
                <p className="text-gray-400">Tell us a bit more about you to personalize your experience.</p>
              </div>

              <form onSubmit={handleBirthdaySubmit} className="space-y-6">
                {(errors.name || errors.birthday || errors.gender || errors.genderPreference) && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {errors.name || errors.birthday || errors.gender || errors.genderPreference}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Nome Completo</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Primeiro e último nome"
                    className="w-full pl-4 pr-4 py-4 rounded-xl outline-none transition-all duration-300"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Birthday */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Date of Birth</label>
                  <input
                    type="date"
                    value={profileData.birthday}
                    onChange={(e) => setProfileData(prev => ({ ...prev, birthday: e.target.value }))}
                    className="w-full pl-4 pr-4 py-4 rounded-xl outline-none transition-all duration-300"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      colorScheme: 'dark'
                    }}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['male', 'female'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setProfileData(prev => ({ ...prev, gender: g as any }))}
                        className={`py-3 rounded-xl border transition-all duration-300 font-medium capitalize ${profileData.gender === g
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                          : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30'
                          }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preference */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Show me...</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'male', label: 'Men' },
                      { value: 'female', label: 'Women' },
                      { value: 'everyone', label: 'Everyone' }
                    ].map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setProfileData(prev => ({ ...prev, genderPreference: p.value as any }))}
                        className={`py-3 rounded-xl border transition-all duration-300 font-medium text-sm ${profileData.genderPreference === p.value
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                          : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30'
                          }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="w-full py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
                  }}
                  whileHover={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" /> : 'Complete Setup'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="rounded-3xl p-8 md:p-10 relative"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Back to Home Button (Icon Only) */}
              <button
                onClick={() => window.location.href = '/'}
                className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors"
                title="Voltar ao Início"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              {/* Sliding Toggle */}
              <div className="mb-8 mt-12">
                <div
                  className="relative p-1 rounded-full"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="grid grid-cols-2 relative">
                    {/* Sliding background */}
                    <motion.div
                      className="absolute top-0 bottom-0 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                      }}
                      initial={false}
                      animate={{
                        left: mode === 'login' ? '0%' : '50%',
                        right: mode === 'login' ? '50%' : '0%',
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />

                    {/* Buttons */}
                    <button
                      onClick={() => handleModeChange('login')}
                      className="relative z-10 py-3 rounded-full transition-colors duration-300 font-semibold"
                      style={{
                        color: mode === 'login' ? '#000000' : '#ffffff',
                      }}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => handleModeChange('register')}
                      className="relative z-10 py-3 rounded-full transition-colors duration-300 font-semibold"
                      style={{
                        color: mode === 'register' ? '#000000' : '#ffffff',
                      }}
                    >
                      Register
                    </button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAuth} className="space-y-5">
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                  >
                    {apiError}
                  </motion.div>
                )}
                {apiSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center"
                  >
                    {apiSuccess}
                  </motion.div>
                )}
                <AnimatePresence mode="sync">
                  {/* Name field - only in register mode */}
                  {mode === 'register' && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          onBlur={() => handleBlur('name')}
                          className="w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all duration-300"
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                          }}
                        />
                      </div>
                      <AnimatePresence>
                        {errors.name && (
                          <motion.div
                            key="name-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-red-500 text-sm ml-1 overflow-hidden"
                          >
                            <p className="mt-2">{errors.name}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Email field */}
                  <motion.div
                    key="email-field"
                    layout
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className="w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all duration-300"
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                        }}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.email && (
                        <motion.div
                          key="email-error"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-red-500 text-sm ml-1 overflow-hidden"
                        >
                          <p className="mt-2">{errors.email}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Password field */}
                  <motion.div
                    key="password-field"
                    layout
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}

                        className="w-full pl-12 pr-12 py-4 rounded-xl outline-none transition-all duration-300"
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {errors.password && (
                        <motion.div
                          key="password-error"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-red-500 text-sm ml-1 overflow-hidden"
                        >
                          <p className="mt-2">{errors.password}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Confirm Password - slides in when password has content */}
                  {showConfirmPasswordField && (
                    <motion.div
                      key="confirm-password-field"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: '1.25rem' }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          onBlur={() => handleBlur('confirmPassword')}
                          className="w-full pl-12 pr-12 py-4 rounded-xl outline-none transition-all duration-300"
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: formData.confirmPassword && formData.password !== formData.confirmPassword
                              ? '1px solid rgba(239, 68, 68, 0.5)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {errors.confirmPassword && (
                          <motion.div
                            key="confirm-password-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-red-500 text-sm ml-1 overflow-hidden"
                          >
                            <p className="mt-2">{errors.confirmPassword}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forgot Password - only in login mode */}
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setView('forgot-password')}
                      className="text-sm transition-colors"
                      style={{
                        color: '#D4AF37',
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  className="w-full py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 mt-6"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
                  }}
                  whileHover={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" /> : (mode === 'login' ? 'Enter' : 'Create Account')}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px" style={{ background: 'rgba(255, 255, 255, 0.1)' }}></div>
                <span className="text-sm text-gray-400">Or continue with</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255, 255, 255, 0.1)' }}></div>
              </div>

              {/* Social Login */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => handleGoogleLogin()}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-sm font-medium text-white">Continue with Google</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer text */}
        <p className="mt-8 text-sm text-gray-500 text-center">
          Exclusive access to Portugal's premier nightlife
        </p>
      </div>
    </div >
  );
}