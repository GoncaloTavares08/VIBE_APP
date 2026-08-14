import { useState, useEffect, useCallback, useRef } from 'react';
import { ExternalLink, Edit, Share2, Instagram, Copy, CheckCircle2, Calendar, Music, Loader2, Clock, Users, Check, X, AlertCircle, Camera, Plus, Trash2, Ghost, Flame, Sparkles, Heart } from 'lucide-react';
import { apiFetch } from '../../../services/api';
import { GlassCard } from '../../ui/GlassCard';

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

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const clean = url.replace(/^\/?api\/serve-image\?file=/, '').replace(/^\/?storage\//, '');
  return `/api/serve-image?file=${clean}`;
};

export function RPProfile() {
  const [activeTab, setActiveTab] = useState<'rp' | 'tinder'>('rp');

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

  // Social Profile States
  const [tinderPhotos, setTinderPhotos] = useState<Array<{ id: number; photo_path: string; photo_order: number }>>([]);
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | 'everyone'>('everyone');
  const [ghostMode, setGhostMode] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  // Fetch profile events on mount
  useEffect(() => {
    fetchProfileEvents();
    loadProfile();
    loadClientProfile();
  }, []);

  // Load RP profile
  const loadProfile = async () => {
    if (!userId) return;

    try {
      const data = await apiFetch('/rp/profile');

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

  // Load Client / Social profile
  const loadClientProfile = async () => {
    if (!userId) return;
    try {
      const data = await apiFetch('/profile');
      if (data.status === 'success' && data.data) {
        setGenderPreference(data.data.gender_preference || 'everyone');
        setGhostMode(data.data.ghost_mode === 1);
        setTinderPhotos(data.data.gallery_photos || []);
      }
    } catch (err) {
      console.error('Error loading client profile:', err);
    }
  };

  // Gallery Photo Upload Handler
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (tinderPhotos.length >= 6) {
      setSaveMessage({ type: 'error', text: 'Máximo de 6 fotos atingido' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Ficheiro muito grande. Máximo: 5MB' });
      return;
    }

    try {
      setUploadingGallery(true);
      const dataUpload = new FormData();
      dataUpload.append('photo', file);
      dataUpload.append('user_id', userId.toString());

      const data = await apiFetch('/profile/gallery', {
        method: 'POST',
        body: dataUpload
      });

      if (data.status === 'success') {
        setTinderPhotos(prev => [...prev, data.data]);
        setSaveMessage({ type: 'success', text: 'Foto adicionada à tua galeria!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Erro ao enviar foto' });
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Delete Gallery Photo Handler
  const handleDeleteGalleryPhoto = async (photoId: number) => {
    try {
      const data = await apiFetch(`/profile/gallery/${photoId}`, {
        method: 'DELETE',
      });
      if (data.status === 'success') {
        setTinderPhotos(prev => prev.filter(p => p.id !== photoId));
        setSaveMessage({ type: 'success', text: 'Foto removida da galeria' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
    }
  };

  // Update Connection Preference Handler
  const handleUpdateGenderPreference = async (pref: 'everyone' | 'female' | 'male') => {
    setGenderPreference(pref);
    try {
      await apiFetch('/profile', {
        method: 'POST',
        body: JSON.stringify({
          gender_preference: pref,
          ghost_mode: ghostMode ? 1 : 0
        })
      });
      setSaveMessage({ type: 'success', text: 'Preferência de conexão atualizada!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Error updating connection preference:', err);
    }
  };

  // Toggle Ghost Mode Handler
  const handleToggleGhostMode = async () => {
    const nextMode = !ghostMode;
    setGhostMode(nextMode);
    try {
      await apiFetch('/profile', {
        method: 'POST',
        body: JSON.stringify({
          gender_preference: genderPreference,
          ghost_mode: nextMode ? 1 : 0
        })
      });
      setSaveMessage({
        type: 'success',
        text: nextMode ? 'Modo Fantasma ativado! Estás oculto da festa.' : 'Modo Fantasma desativado! Estás visível na festa.'
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Error toggling ghost mode:', err);
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
      const data = await apiFetch('/rp/profile/check-username', {
        method: 'POST',
        body: JSON.stringify({ username })
      });

      if (data.status === 'success') {
        setUsernameStatus(data.available ? 'available' : 'taken');
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setUsernameStatus('idle');
    }
  }, []);

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
      const data = await apiFetch('/rp/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

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
      const uploadData = new FormData();
      uploadData.append('photo', file);

      const data = await apiFetch('/rp/profile/photo', {
        method: 'POST',
        body: uploadData
      });

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
      if (!userId) return;
      const response = await apiFetch(`/rp/events?user_id=${userId}`);
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
      if (!userId) return;
      console.log('[RPProfile] Fetching all events...');
      const response = await apiFetch(`/rp/events?all=true&user_id=${userId}`);
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
        await apiFetch('/rp/events', {
          method: 'POST',
          body: JSON.stringify({
            event_id: event.id,
            user_id: userId
          })
        });
      }

      // Remove deselected events
      for (const event of toRemove) {
        await apiFetch('/rp/events', {
          method: 'DELETE',
          body: JSON.stringify({
            event_id: event.id,
            user_id: userId
          })
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
    const publicUrl = formData.username ? `${window.location.origin}/guest/${formData.username}` : '';
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 2000);
    }
  };

  const handleShareLink = () => {
    const publicUrl = formData.username ? `${window.location.origin}/guest/${formData.username}` : '';
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
      window.history.pushState({}, '', `/guest/${formData.username}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl text-white font-bold mb-2">O Meu Perfil</h1>
          <p className="text-gray-400">Gere a tua landing page de promotor e as fotos do Tinder / Radar</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 rounded-2xl bg-white/5 border border-white/10 w-full sm:w-fit gap-2">
          <button
            onClick={() => setActiveTab('rp')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'rp'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Perfil Promotor</span>
          </button>

          <button
            onClick={() => setActiveTab('tinder')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'tinder'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Fotos & Social</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          saveMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {saveMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{saveMessage.text}</span>
        </div>
      )}

      {/* RP PROMOTER TAB */}
      {activeTab === 'rp' && (
        <div className="space-y-6">
          {/* Profile Preview Card */}
          <GlassCard className="p-6 lg:p-8">
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
              className="p-6 lg:p-8 rounded-[2rem] mb-6 relative overflow-hidden group"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                {/* Avatar with upload button */}
                <div className="relative">
                  <div className="absolute inset-0 bg-[#D4AF37] rounded-[2.5rem] blur-xl opacity-20 animate-pulse"></div>
                  <div
                    className="w-24 h-24 lg:w-32 lg:h-32 rounded-[2.5rem] flex items-center justify-center flex-shrink-0 overflow-hidden relative z-10"
                    style={{
                      background: formData.profile_image_url ? 'transparent' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                      border: '2px solid rgba(212, 175, 55, 0.5)',
                      boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
                    }}
                  >
                    {formData.profile_image_url ? (
                      <img
                        src={getImageUrl(formData.profile_image_url)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-black">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'RP'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute -bottom-2 -right-2 p-2.5 rounded-full z-20 shadow-lg transition-all duration-300 hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                      color: '#000000',
                      boxShadow: '0 0 15px rgba(212, 175, 55, 0.5)',
                    }}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl text-white font-bold mb-1">{user.name || 'RP User'}</h3>
                  <p className="text-sm text-[#D4AF37] mb-4">Official Promoter • VIP Access</p>
                  <p className="text-sm text-gray-300 max-w-2xl">
                    {formData.bio || 'Adiciona uma biografia ao teu perfil...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-4 mb-6">
              <a
                href={formData.instagram ? `https://instagram.com/${formData.instagram.replace('@', '')}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all duration-300 ${
                  formData.instagram
                    ? 'hover:scale-105 bg-[#E1306C]/20 border border-[#E1306C]/30 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <Instagram className="w-4 h-4 text-[#E1306C]" />
                <span>{formData.instagram ? (formData.instagram.startsWith('@') ? formData.instagram : `@${formData.instagram}`) : 'Sem Instagram'}</span>
              </a>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleShareLink}
                disabled={!formData.username}
                className="px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
                style={{
                  background: formData.username ? 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)' : 'rgba(128, 128, 128, 0.3)',
                  color: formData.username ? '#000000' : '#666666',
                  opacity: formData.username ? 1 : 0.5,
                }}
              >
                <Share2 className="w-5 h-5" />
                <span>Share Profile</span>
              </button>

              <button
                onClick={handleCopyLink}
                disabled={!formData.username}
                className="px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                style={{
                  background: copiedBio ? 'rgba(34, 197, 94, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                  color: copiedBio ? '#4ade80' : '#D4AF37',
                  border: copiedBio ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
                  opacity: formData.username ? 1 : 0.5,
                }}
              >
                {copiedBio ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </GlassCard>

          {/* Events Section */}
          <GlassCard className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl text-white">Eventos Promovidos</h2>
                <p className="text-sm text-gray-400">Eventos que aparecem na tua página pública</p>
              </div>
              <button
                onClick={handleManageEventsClick}
                className="px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:scale-105 flex items-center gap-2"
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  color: '#D4AF37',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <Calendar className="w-4 h-4" />
                <span>Gerir Eventos</span>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
              </div>
            ) : profileEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEventDetail(event);
                      setShowDetailModal(true);
                    }}
                    className="p-4 rounded-2xl transition-all duration-300 hover:border-[#D4AF37]/50 cursor-pointer hover:bg-white/5"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {event.image_url ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-white/10">
                          <img
                            src={getImageUrl(event.image_url)}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
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
          </GlassCard>
        </div>
      )}

      {/* FESTA ATUAL & SOCIAL TAB */}
      {activeTab === 'tinder' && (
        <div className="space-y-6">
          {/* Photo Gallery Card */}
          <GlassCard className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Minhas Fotos</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                    {tinderPhotos.length}/6 Fotos
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Estas fotos aparecem quando outros participantes estiverem a navegar no separador Festa Atual
                </p>
              </div>

              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGallery || tinderPhotos.length >= 6}
                className="px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  color: '#000000',
                }}
              >
                {uploadingGallery ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 text-black" />
                )}
                <span>Adicionar Foto</span>
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </div>

            {/* Grid of 6 Photo Slots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {tinderPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/40"
                >
                  <img
                    src={getImageUrl(photo.photo_path)}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Slot Number */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                    #{index + 1}
                  </div>
                  {/* Delete button */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteGalleryPhoto(photo.id)}
                      className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: Math.max(0, 6 - tinderPhotos.length) }).map((_, idx) => (
                <button
                  key={`empty-${idx}`}
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 hover:border-[#D4AF37]/50 bg-white/[0.02] hover:bg-[#D4AF37]/5 transition-all duration-300 flex flex-col items-center justify-center gap-2 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-[#D4AF37]/20 flex items-center justify-center transition-colors">
                    <Camera className="w-5 h-5 text-gray-500 group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                  <span className="text-xs text-gray-500 group-hover:text-[#D4AF37] font-medium transition-colors">
                    + Foto
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Preferences & Privacy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matching Preferences */}
            <GlassCard className="p-6 lg:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    <Heart className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Preferências de Conexão</h3>
                    <p className="text-xs text-gray-400">Quem pretendes encontrar na Festa Atual</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                    Quero Ver na Festa Atual:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['everyone', 'female', 'male'] as const).map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => handleUpdateGenderPreference(pref)}
                        className={`py-3.5 px-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center ${
                          genderPreference === pref
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-[1.02]'
                            : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/25 hover:bg-white/10'
                        }`}
                      >
                        {pref === 'everyone' ? 'Todos' : pref === 'female' ? 'Mulheres' : 'Homens'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                💡 O teu Instagram e Bio são sincronizados automaticamente a partir do teu Perfil Promotor.
              </p>
            </GlassCard>

            {/* Ghost Mode Privacy Control */}
            <GlassCard className="p-6 lg:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: ghostMode ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)', border: ghostMode ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Ghost className={`w-6 h-6 ${ghostMode ? 'text-purple-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Controlo de Privacidade</h3>
                    <p className="text-xs text-gray-400">Visibilidade na festa e classificação</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Modo Fantasma</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ghostMode
                        ? 'Oculto do "Quem Está Aqui" e da tabela pública'
                        : 'Visível para os outros participantes da festa'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleGhostMode}
                    className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer flex items-center ${ghostMode ? 'bg-purple-600' : 'bg-gray-700'}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${ghostMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>O Modo Fantasma oculta a tua presença mantendo todos os teus pontos.</span>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[2rem] backdrop-blur-xl overflow-hidden"
            style={{
              background: 'rgba(15, 15, 15, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 80px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(212, 175, 55, 0.05)',
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
                          src={getImageUrl(formData.profile_image_url)}
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
            className="w-full max-w-2xl rounded-[2rem] backdrop-blur-xl overflow-hidden"
            style={{
              background: 'rgba(15, 15, 15, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 80px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(212, 175, 55, 0.05)',
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
                            src={getImageUrl(event.image_url)}
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
            className="w-full max-w-2xl rounded-[2rem] backdrop-blur-xl overflow-hidden"
            style={{
              background: 'rgba(15, 15, 15, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 80px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(212, 175, 55, 0.05)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEventDetail.image_url && (
              <div style={{ height: '300px' }}>
                <img src={getImageUrl(selectedEventDetail.image_url)} alt={selectedEventDetail.name} className="w-full h-full object-cover" />
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
