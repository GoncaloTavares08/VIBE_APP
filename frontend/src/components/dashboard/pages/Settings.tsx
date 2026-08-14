import { useState, useEffect, useRef } from 'react';
import { Bell, Building, Shield, Save, AlertTriangle, Users, TrendingUp, Loader2, Upload, Link, X } from 'lucide-react';
import { apiFetch } from '../../../services/api';

interface ClubSettings {
  id: number;
  name: string;
  logo_url?: string;
  slug: string;
  location: string;
  address: string;
  city: string;
  max_capacity: number;
  opening_time: string;
  closing_time: string;
  contact_phone: string;
  language: string;
  timezone: string;
  dark_mode: number;
  notifications: {
    eventSoldOut: boolean;
    capacityWarning: boolean;
    revenueGoals: boolean;
    securityAlerts: boolean;
    rpPerformance: boolean;
    systemIssues: boolean;
  };
}

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Logo states
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states - todos os campos da DB
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(0);
  const [openingTime, setOpeningTime] = useState('00:00');
  const [closingTime, setClosingTime] = useState('06:00');
  const [contactPhone, setContactPhone] = useState('');
  const [language, setLanguage] = useState('pt');
  const [timezone, setTimezone] = useState('lisbon');
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    eventSoldOut: true,
    capacityWarning: true,
    revenueGoals: true,
    securityAlerts: true,
    rpPerformance: false,
    systemIssues: true,
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch club settings on mount
  useEffect(() => {
    fetchClubSettings();
  }, []);

  const fetchClubSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch('/admin/settings', {
        method: 'GET'
      });

      if (data.status !== 'success') {
        throw new Error(data.message || 'Erro ao carregar configurações');
      }

      const settings: ClubSettings = data.data;

      // Update form states com dados da DB
      setName(settings.name || '');
      setLogoUrl(settings.logo_url || '');
      setLogoPreview(settings.logo_url || null);
      setAddress(settings.address || '');
      setCity(settings.city || '');
      setMaxCapacity(settings.max_capacity || 800);
      setOpeningTime(settings.opening_time?.substring(0, 5) || '23:00');
      setClosingTime(settings.closing_time?.substring(0, 5) || '06:00');
      setContactPhone(settings.contact_phone || '');
      setLanguage(settings.language || 'pt');
      setTimezone(settings.timezone || 'lisbon');
      setDarkMode(settings.dark_mode === 1);
      setNotifications(settings.notifications || {
        eventSoldOut: true,
        capacityWarning: true,
        revenueGoals: true,
        securityAlerts: true,
        rpPerformance: false,
        systemIssues: true,
      });
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err);
      setError(err.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);
    }
  };

  const handleClearLogo = () => {
    setLogoFile(null);
    setLogoUrl('');
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('address', address);
      formData.append('city', city);
      formData.append('max_capacity', String(maxCapacity));
      formData.append('opening_time', openingTime);
      formData.append('closing_time', closingTime);
      formData.append('contact_phone', contactPhone);
      formData.append('language', language);
      formData.append('timezone', timezone);
      formData.append('darkMode', darkMode ? '1' : '0');
      formData.append('notifications', JSON.stringify(notifications));

      if (logoFile) {
        formData.append('logo_file', logoFile);
      } else {
        formData.append('logo_url', logoUrl);
      }

      const data = await apiFetch('/admin/settings', {
        method: 'POST',
        body: formData,
      });

      if (data.status !== 'success') {
        throw new Error(data.message || 'Erro ao guardar configurações');
      }

      if (data.data?.logo_url) {
        setLogoUrl(data.data.logo_url);
        setLogoPreview(data.data.logo_url);
        setLogoFile(null);
      }

      setSuccessMessage('Configurações e Logo guardados com sucesso!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao guardar configurações:', err);
      setError(err.message || 'Erro ao guardar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('A nova password e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('A nova password deve ter pelo menos 8 caracteres.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await apiFetch('/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (response.status === 'success') {
        setPasswordSuccess(response.message || 'Password alterada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(response.message || 'Erro ao alterar a password.');
      }
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordError(err.message || 'Ocorreu um erro ao comunicar com o servidor.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          <p className="text-gray-400 text-sm">A carregar configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 rounded-2xl flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <Save className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1
          className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Definições do Clube
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
          Gere os parâmetros operacionais, logotipo, notificações e dados do clube
        </p>
      </div>

      {/* Club Settings */}
      <div
        className="p-6 sm:p-8 rounded-[2rem] border border-white/10"
        style={{
          background: 'rgba(15, 15, 15, 0.75)',
          backdropFilter: 'blur(25px)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Dados do Estabelecimento</h2>
            <p className="text-xs text-gray-400">Logotipo, informações gerais e capacidade</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Logo Upload Section */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Logótipo do Clube (Upload ou Link)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Preview */}
              <div className="relative w-20 h-20 rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg group">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo do Clube"
                    className="w-full h-full object-cover"
                    onError={() => setLogoPreview(null)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-600">
                    <Building className="w-8 h-8 text-[#D4AF37]/50" />
                  </div>
                )}
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleClearLogo}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                    title="Remover logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Upload or URL Controls */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Upload Ficheiro</span>
                  </button>
                  {logoFile && (
                    <span className="text-xs text-green-400 font-medium">
                      ✓ Ficheiro selecionado: {logoFile.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ou cola o URL da imagem do logo (https://...)"
                      value={logoUrl}
                      onChange={(e) => {
                        setLogoUrl(e.target.value);
                        setLogoFile(null);
                        setLogoPreview(e.target.value || null);
                      }}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:border-[#D4AF37] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome do Clube</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Morada</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Capacidade Máxima</label>
              <input
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hora de Abertura</label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hora de Fecho</label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Telefone de Contacto</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div
        className="p-6 sm:p-8 rounded-[2rem] border border-white/10"
        style={{
          background: 'rgba(15, 15, 15, 0.75)',
          backdropFilter: 'blur(25px)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Alertas & Notificações</h2>
            <p className="text-xs text-gray-400">Personaliza os alertas em tempo real</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white text-sm font-bold">Eventos Esgotados</h3>
                <p className="text-xs text-gray-400">Notificação quando um evento atingir lotação máxima</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, eventSoldOut: !notifications.eventSoldOut })}
              className="relative w-12 h-6 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.eventSoldOut ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-black rounded-full transition-transform shadow-md"
                style={{
                  transform: notifications.eventSoldOut ? 'translateX(28px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white text-sm font-bold">Aviso de Capacidade</h3>
                <p className="text-xs text-gray-400">Alerta quando atingir 80% ou 90% da capacidade</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, capacityWarning: !notifications.capacityWarning })}
              className="relative w-12 h-6 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.capacityWarning ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-black rounded-full transition-transform shadow-md"
                style={{
                  transform: notifications.capacityWarning ? 'translateX(28px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white text-sm font-bold">Metas de Faturação</h3>
                <p className="text-xs text-gray-400">Notificação ao atingir objetivos diários de receita</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, revenueGoals: !notifications.revenueGoals })}
              className="relative w-12 h-6 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.revenueGoals ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-black rounded-full transition-transform shadow-md"
                style={{
                  transform: notifications.revenueGoals ? 'translateX(28px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white text-sm font-bold">Alertas de Segurança</h3>
                <p className="text-xs text-gray-400">Notificações sobre incidentes ou acessos suspeitos</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, securityAlerts: !notifications.securityAlerts })}
              className="relative w-12 h-6 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.securityAlerts ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-black rounded-full transition-transform shadow-md"
                style={{
                  transform: notifications.securityAlerts ? 'translateX(28px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div
        className="p-6 sm:p-8 rounded-[2rem] border border-white/10"
        style={{
          background: 'rgba(15, 15, 15, 0.75)',
          backdropFilter: 'blur(25px)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Segurança & Palavra-passe</h2>
            <p className="text-xs text-gray-400">Atualiza as credenciais de acesso da conta</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
              {passwordSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Palavra-passe Atual</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nova Palavra-passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirmar Nova Palavra-passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-3 rounded-xl font-bold text-xs transition-all duration-300 hover:scale-105 shadow-md flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#000000',
              }}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A alterar...</span>
                </>
              ) : (
                <span>Alterar Palavra-passe</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => fetchClubSettings()}
          className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-colors"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3.5 rounded-2xl font-bold text-xs transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            color: '#000000',
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.35)',
          }}
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'A guardar...' : 'Guardar Alterações'}</span>
        </button>
      </div>
    </div>
  );
}
