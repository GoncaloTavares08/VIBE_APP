import { useState, useEffect, useCallback, useRef } from 'react';
import { ExternalLink, Edit, Share2, Instagram, Copy, CheckCircle2, Calendar, Music, Loader2, Clock, Users, Check, X, AlertCircle, Camera } from 'lucide-react';
import { apiFetch } from '../../../services/api';

interface Event {
  id: number;
  name: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  organizer_name?: string;
  image_url?: string;
  status: 'upcoming' | 'completed';
  is_selected?: boolean;
}

export function RPProfile() {
  // Existing states
  const [copiedBio, setCopiedBio] = useState(false);
  const [profileEvents, setProfileEvents] = useState<Event[]>([]);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState<Event | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // NEW: Profile editing states
  const [profileData, setProfileData] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    instagram: '',
    profile_image_url: ''
  });
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;


  // Fetch profile events on mount
  useEffect(() => {
    fetchProfileEvents();
    loadProfile(); // NEW: Load profile data
  }, []);

  // NEW: Load RP profile
  const loadProfile = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/controllers/rp_profile_manage.php?action=get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        setProfileData(data.data);
        setFormData({
          username: data.data.username || '',
          bio: data.data.bio || '',
          instagram: data.data.instagram || '',
          profile_image_url: data.data.profile_image_url || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  // NEW: Check username availability (debounced)
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    // Validate format
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    try {
      const response = await fetch('/api/controllers/rp_profile_manage.php?action=check_username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, user_id: userId })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setUsernameStatus(data.available ? 'available' : 'taken');
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setUsernameStatus('idle');
    }
  }, [userId]);

  // NEW: Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && formData.username !== profileData?.username) {
        checkUsername(formData.username);
      } else if (formData.username) {
        setUsernameStatus('available'); // Own username is "available"
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username, profileData?.username, checkUsername]);

  // NEW: Save profile
  const handleSaveProfile = async () => {
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      setSaveMessage({ type: 'error', text: 'Username inválido ou já em uso' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/controllers/rp_profile_manage.php?action=save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...formData
        })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setSaveMessage({ type: 'success', text: data.message });
        setProfileData(formData);
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        setSaveMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveMessage({ type: 'error', text: 'Erro ao guardar perfil' });
    } finally {
      setSaving(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Ficheiro muito grande. Máximo: 5MB' });
      return;
    }

    try {
      setUploadingPhoto(true);
      const formDataUpload = new FormData();
      formDataUpload.append('photo', file);
      formDataUpload.append('user_id', userId.toString());

      const response = await fetch('/api/controllers/rp_profile_manage.php?action=upload_profile_photo', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await response.json();

      if (data.status === 'success') {
        // Update form data with new photo path
        setFormData({ ...formData, profile_image_url: data.photo_path });
        setSaveMessage({ type: 'success', text: data.message });
      } else {
        setSaveMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: 'Erro ao enviar foto' });
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };


  const fetchProfileEvents = async () => {
    try {
      const response = await apiFetch('/controllers/rp_profile_events.php');
      if (response.status === 'success') {
        setProfileEvents(response.data);
      }
    } catch (err) {
      console.error('Error fetching profile events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEventsWithStatus = async () => {
    try {
      console.log('[RPProfile] Fetching all events...');
      const response = await apiFetch('/controllers/rp_profile_events.php?all=true');
      console.log('[RPProfile] Response:', response);
      if (response.status === 'success') {
        setAllEvents(response.data);
      } else {
        console.error('[RPProfile] API returned error:', response);
      }
    } catch (err) {
      console.error('Error fetching all events:', err);
    }
  };

  const handleManageEventsClick = async () => {
    setShowManageModal(true);
    await fetchAllEventsWithStatus();
  };

  const handleToggleEvent = (eventId: number) => {
    setAllEvents(prev => prev.map(event =>
      event.id === eventId ? { ...event, is_selected: !event.is_selected } : event
    ));
  };

  const handleSaveSelection = async () => {
    setSaving(true);
    try {
      // Get currently selected events from DB
      const currentlySelected = allEvents.filter(e => profileEvents.some(pe => pe.id === e.id));
      const newlySelected = allEvents.filter(e => e.is_selected);

      // Calculate additions and removals
      const toAdd = newlySelected.filter(e => !currentlySelected.some(ce => ce.id === e.id));
      const toRemove = currentlySelected.filter(e => !newlySelected.some(ne => ne.id === e.id));

      // Add new events
      for (const event of toAdd) {
        await apiFetch('/controllers/rp_profile_events.php', {
          method: 'POST',
          body: JSON.stringify({ event_id: event.id })
        });
      }

      // Remove deselected events
      for (const event of toRemove) {
        await apiFetch('/controllers/rp_profile_events.php', {
          method: 'DELETE',
          body: JSON.stringify({ event_id: event.id })
        });
      }

      // Refresh profile events
      await fetchProfileEvents();
      setShowManageModal(false);
    } catch (err) {
      console.error('Error saving selection:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    const publicUrl = formData.username ? `https://vibe.infinityfree.me/guest/${formData.username}` : '';
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 2000);
    }
  };

  const handleShareLink = () => {
    const publicUrl = formData.username ? `https://vibe.infinityfree.me/guest/${formData.username}` : '';
    if (publicUrl && navigator.share) {
      navigator.share({
        title: `Perfil de ${user.name}`,
        text: `Vê o meu perfil!`,
        url: publicUrl
      }).catch(() => {
        // Fallback: just copy
        handleCopyLink();
      });
    } else {
      handleCopyLink();
    }
  };

  const handleViewLive = () => {
    if (formData.username) {
      window.open(`/guest/${formData.username}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl text-white mb-2">My Public Profile</h1>
        <p className="text-gray-400">Preview da tua página pública para clientes</p>
      </div>

      {/* Profile Preview Card */}
      <div
        className="p-6 lg:p-8 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl text-white">Public Landing Page</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: 'rgba(212, 175, 55, 0.2)',
                color: '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={handleViewLive}
              disabled={!formData.username}
              className="px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: formData.username ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(128, 128, 128, 0.3)',
                color: formData.username ? '#000000' : '#666666',
                opacity: formData.username ? 1 : 0.5,
              }}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">View Live</span>
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div
          className="p-6 lg:p-8 rounded-2xl mb-6"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Avatar with upload button */}
            <div className="relative">
              <div
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{
                  background: formData.profile_image_url ? 'transparent' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)',
                }}
              >
                {formData.profile_image_url ? (
                  <img
                    src={`/api/controllers/serve_image.php?file=${formData.profile_image_url}`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl lg:text-6xl text-black font-black">{user.name?.charAt(0) || '?'}</span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl text-white mb-2">{user.name || 'Seu Nome'}</h1>
              <p className="text-[#D4AF37] mb-4">@{formData.username || 'username'}</p>
              <p className="text-gray-300 mb-6 max-w-2xl">{formData.bio || 'Adicione uma biografia...'}</p>

              {/* Social Links */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {formData.instagram && (
                  <a
                    href={`https://instagram.com/${formData.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Instagram className="w-4 h-4" />
                    <span>@{formData.instagram}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Public Link */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Your Public Link</label>
          <div
            className="p-4 rounded-xl flex items-center gap-2 sm:gap-3"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ExternalLink className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
            <input
              type="text"
              value={formData.username ? `https://vibe.infinityfree.me/guest/${formData.username}` : 'Defina um username primeiro'}
              readOnly
              className="flex-1 bg-transparent text-white outline-none min-w-0"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: copiedBio ? 'rgba(34, 197, 94, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                color: copiedBio ? '#22c55e' : '#D4AF37',
                border: copiedBio ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              {copiedBio ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-semibold">Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleShareLink}
              className="px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#000000',
              }}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-semibold">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div
        className="p-6 rounded-3xl backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-white">Your Upcoming Events</h2>
          <button
            onClick={handleManageEventsClick}
            className="px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(212, 175, 55, 0.2)',
              color: '#D4AF37',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <span className="font-semibold">Manage Events</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            Carregando eventos...
          </div>
        ) : profileEvents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {profileEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => {
                  setSelectedEventDetail(event);
                  setShowDetailModal(true);
                }}
                className="p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                <div className="flex items-start gap-4">
                  {event.image_url ? (
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(212, 175, 55, 0.2)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                      }}
                    >
                      <Calendar className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg text-white font-semibold mb-3">{event.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Music className="w-4 h-4" />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Sem eventos disponíveis
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl backdrop-blur-xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <h2 className="text-3xl text-white font-bold mb-6">Edit Your Profile</h2>

              {/* Success/Error Message */}
              {saveMessage && (
                <div
                  className="mb-6 p-4 rounded-xl flex items-center gap-3"
                  style={{
                    background: saveMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: saveMessage.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {saveMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <p className={saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {saveMessage.text}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Foto de Perfil</label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                      style={{
                        background: formData.profile_image_url ? 'transparent' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {formData.profile_image_url ? (
                        <img
                          src={`/api/controllers/serve_image.php?file=${formData.profile_image_url}`}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-black" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                      style={{
                        background: 'rgba(212, 175, 55, 0.2)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#D4AF37'
                      }}
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      {uploadingPhoto ? 'A enviar...' : 'Carregar Foto'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Máximo 5MB - JPG, PNG ou WebP</p>
                </div>

                {/* Username with validation */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Username (para link público)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">/guest/</span>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                        placeholder="seuusername"
                      />
                      {/* Validation Icon */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                        {usernameStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                        {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                  </div>
                  {usernameStatus === 'invalid' && (
                    <p className="text-xs text-red-400 mt-1">3-50 caracteres (letras, números, _)</p>
                  )}
                  {usernameStatus === 'taken' && (
                    <p className="text-xs text-red-400 mt-1">Username já em uso</p>
                  )}
                  {formData.username && usernameStatus === 'available' && (
                    <p className="text-xs text-gray-500 mt-1">Link: /guest/{formData.username}</p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
                    placeholder="Fala sobre ti..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 caracteres</p>
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Instagram Handle</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">@</span>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value.replace('@', '') })}
                      maxLength={30}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                      placeholder="seuinstagram"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSaveMessage(null);
                    }}
                    className="flex-1 px-6 py-3 rounded-xl transition-colors"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#888888',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveProfile();
                      if (usernameStatus !== 'taken' && usernameStatus !== 'invalid' && formData.username) {
                        setTimeout(() => setShowEditModal(false), 2000);
                      }
                    }}
                    disabled={saving || usernameStatus === 'taken' || usernameStatus === 'invalid' || !formData.username}
                    className="flex-1 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      background: saving ? 'rgba(212, 175, 55, 0.5)' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                      color: '#000000',
                      opacity: (usernameStatus === 'taken' || usernameStatus === 'invalid' || !formData.username) ? 0.5 : 1,
                    }}
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    <span className="font-semibold">{saving ? 'Guardando...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Events Modal */}
      {showManageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
          onClick={() => setShowManageModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl backdrop-blur-xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <h2 className="text-3xl text-white font-bold mb-6">Gerir Eventos do Perfil</h2>
              <p className="text-gray-400 mb-6">Selecione os eventos que quer mostrar no seu perfil público</p>

              <div className="space-y-3 mb-8">
                {allEvents.length > 0 ? allEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleToggleEvent(event.id)}
                    className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: event.is_selected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: event.is_selected ? '2px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{
                          background: event.is_selected ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
                          border: event.is_selected ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        {event.is_selected && <CheckCircle2 className="w-4 h-4 text-black" />}
                      </div>

                      {event.image_url && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={event.image_url}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="text-white font-semibold">{event.name}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(event.date).toLocaleDateString('pt-PT')} • {event.start_time}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Carregando eventos...
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowManageModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSelection}
                  className="flex-1 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    background: saving ? 'rgba(212, 175, 55, 0.5)' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                  }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showDetailModal && selectedEventDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl backdrop-blur-xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEventDetail.image_url && (
              <div style={{ height: '300px' }}>
                <img src={selectedEventDetail.image_url} alt={selectedEventDetail.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-8">
              <h2 className="text-3xl text-white font-bold mb-2">{selectedEventDetail.name}</h2>
              {selectedEventDetail.description && <p className="text-gray-400 mb-6" style={{ whiteSpace: 'pre-wrap' }}>{selectedEventDetail.description}</p>}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar className="w-5 h-5" /><span className="text-sm">Data</span>
                  </div>
                  <div className="text-white text-lg font-semibold">
                    {new Date(selectedEventDetail.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Clock className="w-5 h-5" /><span className="text-sm">Horário</span>
                  </div>
                  <div className="text-white text-lg font-semibold">{selectedEventDetail.start_time} - {selectedEventDetail.end_time}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Users className="w-5 h-5" /><span className="text-sm">Capacidade</span>
                  </div>
                  <div className="text-white text-lg font-semibold">{selectedEventDetail.capacity} pessoas</div>
                </div>
                {selectedEventDetail.organizer_name && (
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <div className="text-gray-400 mb-2 text-sm">Organizador</div>
                    <div className="text-white text-lg font-semibold">{selectedEventDetail.organizer_name}</div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
