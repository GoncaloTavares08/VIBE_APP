import { useState, useEffect, useRef } from 'react';
import { Camera, Check, User, Eye, EyeOff, Calendar, TrendingUp, Award, Edit, Instagram, Plus, Loader2, AlertCircle, Users, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../services/api';

interface PartyHistoryItem {
  id: number;
  name: string;
  date: string;
  venue: string;
  points_earned: number;
  image_url?: string;
}

interface GalleryPhoto {
  id: number;
  photo_path: string;
  photo_order: number;
}

interface ProfileData {
  id: number;
  bio: string;
  instagram: string;
  profile_photo_path: string | null;
  ghost_mode: number;
  gender_preference: 'male' | 'female' | 'everyone';
  gallery_photos: GalleryPhoto[];
  party_history: PartyHistoryItem[];
  total_parties?: number;
  points?: number;
  global_rank?: number;
}

interface ClientProfileProps {
  onNavigate?: (page: string) => void;
}

export function ClientProfile({ onNavigate }: ClientProfileProps) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | 'everyone'>('everyone');
  const [isEditingInstagram, setIsEditingInstagram] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [partyHistory, setPartyHistory] = useState<PartyHistoryItem[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryPhotoInputRef = useRef<HTMLInputElement>(null);

  const getClubSlug = () => {
    // Priority: User's saved slug > LocalStorage > URL > Default
    if (user?.club_slug) return user.club_slug;
    const stored = localStorage.getItem('clubSlug');
    if (stored) return stored;
    return '';
  };

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const slug = getClubSlug();
      const data = await apiFetch(`/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': slug
        }
      });

      if (data.status === 'success' && data.data) {
        setProfileData(data.data);
        setBio(data.data.bio || '');
        setInstagramHandle(data.data.instagram || '');
        setGhostMode(data.data.ghost_mode === 1);
        setGenderPreference(data.data.gender_preference || 'everyone');
        setPhotos(data.data.gallery_photos || []);
        setPartyHistory(data.data.party_history || []);
        setProfilePhotoUrl(data.data.profile_photo_path || null);

        // DEBUG: Log para verificar os dados
        console.log('Profile loaded:', {
          profile_photo_path: data.data.profile_photo_path,
          gallery_photos: data.data.gallery_photos,
          full_url: data.data.profile_photo_path ? `/api/serve-image?file=${data.data.profile_photo_path}` : 'none'
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      showError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    try {
      setSavingProfile(true);
      const data = await apiFetch('/profile', {
        method: 'POST',
        body: JSON.stringify({
          bio: bio,
          instagram: instagramHandle,
          ghost_mode: ghostMode ? 1 : 0
        })
      });

      if (data.status === 'success') {
        showSuccess(data.message);
        setIsEditingBio(false);
        setIsEditingInstagram(false);
      } else {
        showError(data.message);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      showError('Erro ao guardar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfilePhotoClick = () => {
    profilePhotoInputRef.current?.click();
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Ficheiro muito grande. Máximo: 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('user_id', userId.toString());

      const data = await apiFetch('/profile', {
        method: 'POST',
        body: formData
      });

      if (data.status === 'success') {
        setProfilePhotoUrl(data.photo_path);
        showSuccess(data.message);
      } else {
        showError(data.message);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      showError('Erro ao enviar foto');
    } finally {
      setUploading(false);
      if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = '';
      }
    }
  };



  const handleGalleryPhotoClick = () => {
    if (photos.length >= 6) {
      showError('Máximo de 6 fotos atingido');
      return;
    }
    galleryPhotoInputRef.current?.click();
  };

  const handleGalleryPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (photos.length >= 6) {
      showError('Máximo de 6 fotos atingido');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Ficheiro muito grande. Máximo: 5MB');
      return;
    }

    try {
      setUploadingGallery(true);
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('user_id', userId.toString());

      const data = await apiFetch('/profile/gallery', {
        method: 'POST',
        body: formData
      });

      if (data.status === 'success') {
        setPhotos([...photos, data.data]);
        showSuccess(data.message);
      } else {
        showError(data.message);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      showError('Erro ao enviar foto');
    } finally {
      setUploadingGallery(false);
      if (galleryPhotoInputRef.current) {
        galleryPhotoInputRef.current.value = '';
      }
    }
  };

  const handleDeleteGalleryPhoto = async (photoId: number) => {
    if (!userId) return;

    if (!window.confirm('Queres mesmo apagar esta foto?')) {
      return;
    }

    try {
      const data = await apiFetch(`/profile/gallery/${photoId}`, {
        method: 'DELETE',
        body: JSON.stringify({})
      });

      if (data.status === 'success') {
        setPhotos(photos.filter(p => p.id !== photoId));
        showSuccess(data.message);
      } else {
        showError(data.message);
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      showError('Erro ao remover foto');
    }
  };

  const handleToggleGhostMode = async () => {
    const newGhostMode = !ghostMode;
    setGhostMode(newGhostMode);

    // Auto-save ghost mode
    if (!userId) return;

    try {
      await apiFetch('/profile', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          bio: bio,
          instagram: instagramHandle,
          ghost_mode: newGhostMode ? 1 : 0
        })
      });
    } catch (err) {
      console.error('Error saving ghost mode:', err);
    }
  };

  const handleUpdateGenderPreference = async (newPreference: 'male' | 'female' | 'everyone') => {
    setGenderPreference(newPreference);

    if (!userId) return;

    try {
      await apiFetch('/profile', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          bio: bio,
          instagram: instagramHandle,
          ghost_mode: ghostMode ? 1 : 0,
          gender_preference: newPreference
        })
      });
    } catch (err) {
      console.error('Error saving gender preference:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative p-4 md:p-8">
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(212, 175, 55, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
        }}
      />

      {/* Hidden file inputs */}
      <input
        ref={profilePhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProfilePhotoChange}
      />
      <input
        ref={galleryPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryPhotoChange}
      />

      {/* Error/Success Messages */}
      {error && (
        <div
          className="fixed top-4 right-4 z-50 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-400">{error}</p>
        </div>
      )}
      {successMessage && (
        <div
          className="fixed top-4 right-4 z-50 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Check className="w-5 h-5 text-green-500" />
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div
          className="relative overflow-hidden rounded-[2rem] p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(20, 20, 20, 0.95) 100%)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }} />
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: profilePhotoUrl ? 'transparent' : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                  boxShadow: '0 0 40px rgba(212, 175, 55, 0.5)',
                }}
              >
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl.startsWith('http') ? profilePhotoUrl : `/api/serve-image?file=${profilePhotoUrl}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-black" />
                )}
              </div>
              {/* Edit Button */}
              <button
                onClick={handleProfilePhotoClick}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  background: '#0a0a0a',
                  border: '2px solid #D4AF37',
                }}
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-[#D4AF37]" />
                )}
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1
                className="text-3xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {user.name || 'Seu Nome'}
              </h1>
              <p className="text-gray-400">Gold Member</p>

              {/* Bio */}
              {isEditingBio ? (
                <div className="space-y-3 max-w-md mt-4 relative">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full px-5 py-4 rounded-2xl text-white resize-none shadow-inner"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      outline: 'none',
                    }}
                    placeholder="Escreve uma bio cativante..."
                  />
                  <div className="absolute top-2 right-3 text-[10px] text-gray-500 font-mono">
                    {bio.length}/500
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => {
                        setIsEditingBio(false);
                        setBio(profileData?.bio || '');
                      }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#999',
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="flex-1 py-2.5 rounded-xl text-sm font-black transition-transform active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                        color: '#000',
                        boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                      }}
                    >
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Guardar Bio'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 max-w-md mt-2 p-4 rounded-2xl group transition-all mx-auto md:mx-0"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <p className="text-sm text-gray-300 italic text-left flex-1 break-words">
                    {bio ? `"${bio}"` : 'Adiciona uma bio sobre ti...'}
                  </p>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="text-[#D4AF37] opacity-60 group-hover:opacity-100 hover:scale-110 transition-all p-2 rounded-full"
                    style={{ background: 'rgba(212,175,55,0.1)' }}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-4 md:gap-8 pt-6 justify-center md:justify-start">
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-3xl font-black text-[#D4AF37] drop-shadow-md">{profileData?.total_parties ?? partyHistory.length}</p>
                  <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold">Festas</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-3xl font-black text-[#D4AF37] drop-shadow-md">{profileData?.points || 0}</p>
                  <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold">Pontos</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-3xl font-black text-[#D4AF37] drop-shadow-md">#{profileData?.global_rank || '?'}</p>
                  <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold">Top do Clube</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Handle */}
        <div
          className="p-6 rounded-[2rem] space-y-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Subtle glow effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Instagram className="w-5 h-5 text-[#D4AF37]" />
              Instagram
            </h2>
            <button
              onClick={() => setIsEditingInstagram(!isEditingInstagram)}
              className="text-[#D4AF37] text-sm flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>

          {isEditingInstagram ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">@</span>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
                  className="flex-1 px-4 py-3 rounded-xl text-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    outline: 'none',
                  }}
                  placeholder="username"
                  maxLength={30}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 py-3 rounded-xl transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000',
                  }}
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingInstagram(false);
                    setInstagramHandle(profileData?.instagram || '');
                  }}
                  className="px-6 py-3 rounded-xl transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#888',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div
              className="p-4 rounded-xl flex items-center gap-3"
              style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Instagram className="w-6 h-6 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-lg">@{instagramHandle || 'adicionar'}</span>
            </div>
          )}

          <p className="text-xs text-gray-400">
            💡 Your Instagram will be shared with people you match with
          </p>
        </div>

        {/* Photo Gallery */}
        <div
          className="p-6 rounded-[2rem] space-y-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Subtle glow effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">My Photos</h2>
            <button
              onClick={handleGalleryPhotoClick}
              disabled={uploadingGallery || photos.length >= 6}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: photos.length >= 6 ? 'rgba(128, 128, 128, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                border: `1px solid ${photos.length >= 6 ? 'rgba(128, 128, 128, 0.3)' : 'rgba(212, 175, 55, 0.4)'}`,
                color: photos.length >= 6 ? '#666' : '#D4AF37',
                opacity: photos.length >= 6 ? 0.5 : 1,
              }}
            >
              {uploadingGallery ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Photo
            </button>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <img
                  src={`/api/serve-image?file=${photo.photo_path}`}
                  alt={`Gallery ${photo.photo_order + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Delete Button (Centered, visible on mobile, hover on desktop) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteGalleryPhoto(photo.id);
                  }}
                  className="absolute inset-0 m-auto z-10 w-12 h-12 rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-xl backdrop-blur-sm cursor-pointer"
                  style={{
                    background: 'rgba(20, 20, 20, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Trash2 className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            ))}

            {/* Add Photo Placeholder */}
            {photos.length < 6 && (
              <button
                onClick={handleGalleryPhotoClick}
                disabled={uploadingGallery}
                className="aspect-square rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '2px dashed rgba(212, 175, 55, 0.3)',
                }}
              >
                {uploadingGallery ? (
                  <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                ) : (
                  <Plus className="w-8 h-8 text-[#D4AF37]" />
                )}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400">
            ✨ Add up to 6 photos. These will be shown to other party-goers.
          </p>
        </div>

        {/* Privacy Settings */}
        <div
          className="p-6 rounded-[2rem] space-y-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Subtle glow effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            {ghostMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            Privacy Control
          </h2>

          {/* Ghost Mode Toggle */}
          <div
            className="p-4 rounded-xl flex items-center justify-between"
            style={{
              background: !ghostMode
                ? 'rgba(212, 175, 55, 0.1)'
                : 'rgba(255, 255, 255, 0.03)',
              border: !ghostMode
                ? '1px solid rgba(212, 175, 55, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div>
              <p className="text-white font-black">Visibility in Party</p>
              <p className="text-sm text-gray-400">
                {!ghostMode
                  ? "Your presence is visible to others"
                  : "You're hidden from 'Who is Here' list"}
              </p>
            </div>
            <button
              onClick={handleToggleGhostMode}
              className="relative w-16 h-8 rounded-full p-1 transition-all duration-300"
              style={{
                background: !ghostMode
                  ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                  : 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <div
                className="w-6 h-6 bg-white rounded-full transition-transform duration-300"
                style={{
                  transform: !ghostMode ? 'translateX(32px)' : 'translateX(0)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
              />
            </button>
          </div>

          {ghostMode && (
            <div
              className="p-3 rounded-lg flex items-start gap-3"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <EyeOff className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300">Incógnito Active</p>
                <p className="text-xs text-gray-400 mt-1">
                  You'll still earn points, but others won't see you in the live party section.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Discovery Preference */}
        <div
          className="p-6 rounded-[2rem] space-y-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Subtle glow effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4AF37]" />
            Discovery Preference
          </h2>

          <p className="text-sm text-gray-400">Who do you want to see in the party?</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'male', label: 'Men' },
              { value: 'female', label: 'Women' },
              { value: 'everyone', label: 'Everyone' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleUpdateGenderPreference(option.value as any)}
                className={`py-3 rounded-xl border transition-all duration-300 font-medium text-sm ${genderPreference === option.value
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                  : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div
          className="p-6 rounded-[2rem] space-y-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Subtle glow effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            Achievements
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Early Bird', icon: '🌅', unlocked: true },
              { name: 'Night Owl', icon: '🦉', unlocked: true },
              { name: 'Social King', icon: '👑', unlocked: true },
              { name: 'VIP Legend', icon: '⭐', unlocked: false },
            ].map((achievement, i) => (
              <div
                key={i}
                className="p-4 rounded-xl text-center transition-all duration-300 hover:scale-105"
                style={{
                  background: achievement.unlocked
                    ? 'rgba(212, 175, 55, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: achievement.unlocked
                    ? '1px solid rgba(212, 175, 55, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  opacity: achievement.unlocked ? 1 : 0.4,
                }}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className={`text-sm ${achievement.unlocked ? 'text-[#D4AF37]' : 'text-gray-500'}`}>
                  {achievement.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Party History Timeline */}
        <div
          className="p-6 rounded-[2rem] space-y-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Subtle glow effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Party History
          </h2>

          {/* Timeline */}
          <div className="space-y-4">
            {partyHistory.map((party, index) => (
              <div
                key={party.id}
                className="relative pl-8 pb-6 last:pb-0"
              >
                {/* Timeline Line */}
                <div
                  className="absolute left-[11px] w-0.5 bg-gradient-to-b from-[#D4AF37]/50 to-[#D4AF37]/10"
                  style={{
                    top: index === 0 ? '2.25rem' : '0',
                    bottom: index === partyHistory.length - 1 ? 'auto' : '0',
                    height: index === partyHistory.length - 1 ? (index === 0 ? '0' : '2.25rem') : 'auto',
                  }}
                />

                {/* Timeline Dot */}
                <div
                  className="absolute left-0 top-9 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  style={{
                    background: '#0a0a0a',
                    border: '2px solid #D4AF37',
                    boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                </div>

                {/* Event Card */}
                <div
                  className="p-4 rounded-xl transition-all duration-300 hover:bg-white/5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex gap-4">
                    {/* Event Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                      {party.image_url ? (
                        <img
                          src={party.image_url}
                          alt={party.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-black line-clamp-1">{party.name}</h3>
                          <p className="text-sm text-gray-400">{party.venue || 'Clube Atual'}</p>
                        </div>
                        <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {new Date(party.date).toLocaleDateString('pt-PT', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-sm text-[#D4AF37] font-black">
                          {(party.points_earned || 0).toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <button
            onClick={() => onNavigate?.('history')}
            className="w-full py-3 rounded-xl transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#D4AF37',
            }}
          >
            View All History
          </button>
        </div >
      </div >
    </div >
  );
}