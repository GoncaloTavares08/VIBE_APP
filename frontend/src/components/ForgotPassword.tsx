import { useState } from 'react';
import { Mail, Lock, KeyRound, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../services/api';

interface ForgotPasswordProps {
    onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

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

        return null;
    };

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Por favor insira um email válido');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const data = await apiFetch(`/password/reset-request`, {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            if (data.status === 'success') {
                setStep(2);
            } else {
                setError(data.message || 'Erro ao enviar código');
            }
        } catch (err) {
            setError('Erro de conexão ao servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 4) {
            setError('Código inválido');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const data = await apiFetch(`/password/verify-code`, {
                method: 'POST',
                body: JSON.stringify({ email, code })
            });

            if (data.status === 'success') {
                setStep(3);
            } else {
                setError(data.message || 'Código inválido');
            }
        } catch (err) {
            setError('Erro de conexão ao servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        const passwordError = validatePassword(passwords.new);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (passwords.new !== passwords.confirm) {
            setError('As passwords não coincidem');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const data = await apiFetch(`/password/reset`, {
                method: 'POST',
                body: JSON.stringify({ email, code, password: passwords.new })
            });

            if (data.status === 'success') {
                setShowSuccess(true);
                setTimeout(() => {
                    onBack();
                }, 3000);
            } else {
                setError(data.message || 'Erro ao atualizar password');
            }
        } catch (err) {
            setError('Erro de conexão ao servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md"
        >
            <div
                className="rounded-3xl p-8 md:p-10"
                style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
            >
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao Login
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Recuperar Password</h2>
                    <p className="text-gray-400 text-sm">
                        {step === 1 && "Insira o seu email para receber o código de recuperação"}
                        {step === 2 && `Insira o código enviado para ${email}`}
                        {step === 3 && "Defina a sua nova palavra-passe"}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.form
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleSendCode}
                            className="space-y-4"
                        >
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all duration-300"
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#ffffff',
                                    }}
                                    autoFocus
                                />
                            </div>
                            <motion.button
                                type="submit"
                                className="w-full py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                    color: '#000000',
                                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
                                }}
                                whileHover={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" /> : 'Enviar Código'}
                            </motion.button>
                        </motion.form>
                    )}

                    {step === 2 && (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleVerifyCode}
                            className="space-y-4"
                        >
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Código de Confirmação"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all duration-300 tracking-widest text-center text-lg"
                                    style={{
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#ffffff',
                                    }}
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>
                            <motion.button
                                type="submit"
                                className="w-full py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                    color: '#000000',
                                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
                                }}
                                whileHover={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" /> : 'Verificar Código'}
                            </motion.button>
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm text-[#D4AF37] hover:underline"
                                >
                                    Reenviar código
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {step === 3 && (
                        !showSuccess ? (
                            <motion.form
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleResetPassword}
                                className="space-y-4"
                            >
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nova Password"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        className="w-full pl-12 pr-12 py-4 rounded-xl outline-none transition-all duration-300"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff',
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirmar Password"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="w-full pl-12 pr-12 py-4 rounded-xl outline-none transition-all duration-300"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#ffffff',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <motion.button
                                    type="submit"
                                    className="w-full py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                                    style={{
                                        background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                        color: '#000000',
                                        boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
                                    }}
                                    whileHover={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-black" /> : 'Atualizar Password'}
                                </motion.button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="text-center py-8"
                            >
                                <div className="flex justify-center mb-4">
                                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Password Atualizada!</h3>
                                <p className="text-gray-400">A sua password foi alterada com sucesso.</p>
                                <p className="text-gray-500 text-sm mt-4">A redirecionar para o login...</p>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
