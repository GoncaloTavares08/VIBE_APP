import { useState, useEffect } from 'react';
import { Bell, Lock, Building, Moon, Sun, Globe, Shield, Save, AlertTriangle, Users, TrendingUp } from 'lucide-react';

interface ClubSettings {
  id: number;
  name: string;
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

  // Fetch club settings on mount
  useEffect(() => {
    fetchClubSettings();
  }, []);

  const fetchClubSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const clubSlug = localStorage.getItem('clubSlug') || 'vr';

      const response = await fetch(
        '/api/controllers/admin_club_settings.php?action=get',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': clubSlug,
          },
          credentials: 'include',
        }
      );

      // Get response text first
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response Text:', responseText);
        throw new Error('Erro ao processar resposta do servidor. Verifique o console para detalhes.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao carregar configurações');
      }

      const settings: ClubSettings = data.data;

      // Update form states com dados da DB
      setName(settings.name || '');
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const clubSlug = localStorage.getItem('clubSlug') || 'vr';

      // Validation
      if (!name.trim()) {
        setError('Nome do clube é obrigatório');
        return;
      }

      if (maxCapacity < 1) {
        setError('Capacidade máxima inválida');
        return;
      }

      const payload = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        max_capacity: maxCapacity,
        opening_time: `${openingTime}:00`,
        closing_time: `${closingTime}:00`,
        contact_phone: contactPhone.trim(),
        language,
        timezone,
        dark_mode: darkMode ? 1 : 0,
        notifications,
      };

      const response = await fetch(
        '/api/controllers/admin_club_settings.php?action=update',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': clubSlug,
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao guardar configurações');
      }

      setSuccessMessage('Configurações guardadas com sucesso!');

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-400">A carregar configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div
          className="p-4 rounded-xl flex items-start gap-3"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h4 className="text-white mb-1">Erro</h4>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          className="p-4 rounded-xl flex items-start gap-3"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          <Save className="w-5 h-5 text-green-500 mt-0.5" />
          <div>
            <h4 className="text-white mb-1">Sucesso</h4>
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl text-white mb-2">Settings</h1>
        <p className="text-gray-400">Gere as configurações do teu clube</p>
      </div>

      {/* Club Settings */}
      <div
        className="p-6 rounded-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <Building className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl text-white">Club Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Nome do Clube</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">Morada</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">Capacidade Máxima</label>
              <input
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Hora de Abertura</label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Hora de Fecho</label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Contacto do Clube</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div
        className="p-6 rounded-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <Bell className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl text-white">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white mb-1">Eventos Esgotados</h3>
                <p className="text-sm text-gray-500">Notificação quando um evento atingir capacidade máxima</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, eventSoldOut: !notifications.eventSoldOut })}
              className="relative w-14 h-8 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.eventSoldOut ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg"
                style={{
                  transform: notifications.eventSoldOut ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white mb-1">Aviso de Capacidade</h3>
                <p className="text-sm text-gray-500">Alerta quando atingir 80% ou 90% da capacidade</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, capacityWarning: !notifications.capacityWarning })}
              className="relative w-14 h-8 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.capacityWarning ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg"
                style={{
                  transform: notifications.capacityWarning ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white mb-1">Metas de Revenue</h3>
                <p className="text-sm text-gray-500">Notificação ao atingir objetivos de revenue diários/mensais</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, revenueGoals: !notifications.revenueGoals })}
              className="relative w-14 h-8 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.revenueGoals ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg"
                style={{
                  transform: notifications.revenueGoals ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white mb-1">Alertas de Segurança</h3>
                <p className="text-sm text-gray-500">Notificações sobre incidentes ou problemas de segurança</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, securityAlerts: !notifications.securityAlerts })}
              className="relative w-14 h-8 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.securityAlerts ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg"
                style={{
                  transform: notifications.securityAlerts ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white mb-1">Performance de RPs</h3>
                <p className="text-sm text-gray-500">Relatórios semanais de performance da equipa de RPs</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, rpPerformance: !notifications.rpPerformance })}
              className="relative w-14 h-8 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.rpPerformance ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg"
                style={{
                  transform: notifications.rpPerformance ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-white mb-1">Problemas do Sistema</h3>
                <p className="text-sm text-gray-500">Alertas críticos sobre falhas técnicas ou do sistema</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, systemIssues: !notifications.systemIssues })}
              className="relative w-14 h-8 rounded-full transition-colors shrink-0"
              style={{
                background: notifications.systemIssues ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg"
                style={{
                  transform: notifications.systemIssues ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div
        className="p-6 rounded-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <Shield className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl text-white">Security</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Password Atual</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">Nova Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Confirmar Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div
            className="p-4 rounded-xl flex items-start gap-3"
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
            }}
          >
            <Lock className="w-5 h-5 text-[#D4AF37] mt-0.5" />
            <div>
              <h4 className="text-white mb-1">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-400 mb-3">Adiciona uma camada extra de segurança à tua conta</p>
              <button
                className="px-4 py-2 rounded-lg text-sm transition-colors hover:scale-105 duration-200"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  color: '#D4AF37',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                Ativar 2FA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div
        className="p-6 rounded-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <Globe className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl text-white">Appearance & Language</h2>
        </div>

        <div className="space-y-4">
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-[#D4AF37]" />
              ) : (
                <Sun className="w-5 h-5 text-[#D4AF37]" />
              )}
              <div>
                <h3 className="text-white mb-1">Dark Mode</h3>
                <p className="text-sm text-gray-500">Usa o tema escuro (recomendado)</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="relative w-14 h-8 rounded-full transition-colors shrink-0"
              style={{
                background: darkMode ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-lg"
                style={{
                  transform: darkMode ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Idioma</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
            >
              <option value="lisbon">Europe/Lisbon (GMT+0)</option>
              <option value="london">Europe/London (GMT+0)</option>
              <option value="paris">Europe/Paris (GMT+1)</option>
              <option value="madrid">Europe/Madrid (GMT+1)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => fetchClubSettings()}
          className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            color: '#000000',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
          }}
        >
          <Save className="w-5 h-5" />
          <span className="font-semibold">{saving ? 'A guardar...' : 'Guardar Alterações'}</span>
        </button>
      </div>
    </div>
  );
}
