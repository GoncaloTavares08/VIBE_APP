import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  Plus,
  Search,
  Crown,
  Edit3,
  Loader2,
  MapPin,
  Clock,
  UserPlus,
  Upload,
  Link,
  X
} from 'lucide-react';
import { apiFetch } from '../../../services/api';

interface ClubAdmin {
  id: number;
  name: string;
  email: string;
}

interface ClubItem {
  id: number;
  name: string;
  logo_url?: string;
  slug: string;
  location?: string;
  address?: string;
  city?: string;
  max_capacity: number;
  opening_time?: string;
  closing_time?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  admins?: ClubAdmin[];
  staff_count?: number;
  rp_count?: number;
  event_count?: number;
}

interface UserClubAccessItem {
  club_id: number;
  club_name: string;
  club_slug: string;
  role: string;
  points: number;
  joined_at: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  is_superadmin: boolean;
  created_at: string;
  club_access: UserClubAccessItem[];
}

interface SuperAdminOverview {
  total_clubs: number;
  active_clubs: number;
  network_capacity: number;
  total_users: number;
  new_users_30d: number;
  superadmins_count: number;
  total_admins: number;
  total_staff: number;
  total_rps: number;
  total_events: number;
  active_events: number;
}

export function SuperAdmin() {
  const [activeTab, setActiveTab] = useState<'clubs' | 'permissions'>('clubs');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Overview Data
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);

  // Clubs Data
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [clubSearch, setClubSearch] = useState('');
  const [showClubModal, setShowClubModal] = useState(false);
  const [editingClub, setEditingClub] = useState<ClubItem | null>(null);
  const [clubSubmitting, setClubSubmitting] = useState(false);

  // Users & Permissions Data
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userClubFilter, setUserClubFilter] = useState<string>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<UserItem | null>(null);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // Club Form
  const [clubForm, setClubForm] = useState({
    name: '',
    logo_url: '',
    slug: '',
    location: '',
    address: '',
    city: '',
    max_capacity: 500,
    opening_time: '23:30',
    closing_time: '06:00',
    contact_phone: '',
    is_active: true,
  });
  const [clubLogoFile, setClubLogoFile] = useState<File | null>(null);
  const [clubLogoPreview, setClubLogoPreview] = useState<string | null>(null);
  const clubFileInputRef = useRef<HTMLInputElement>(null);

  // Assign Role Form
  const [assignForm, setAssignForm] = useState({
    club_id: 0,
    role: 'ADMIN',
  });

  // Create Admin Form
  const [createAdminForm, setCreateAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    club_id: '',
    role: 'ADMIN',
  });

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, clubsRes, usersRes] = await Promise.all([
        apiFetch('/superadmin/overview'),
        apiFetch('/superadmin/clubs'),
        apiFetch('/superadmin/users'),
      ]);

      if (overviewRes.status === 'success') setOverview(overviewRes.data);
      if (clubsRes.status === 'success') setClubs(clubsRes.data || []);
      if (usersRes.status === 'success') setUsers(usersRes.data || []);
    } catch (err: any) {
      console.error('SuperAdmin load error:', err);
      setError('Erro ao carregar dados do SuperAdmin. Verifica as tuas permissões.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Club Handlers
  const handleOpenCreateClub = () => {
    setEditingClub(null);
    setClubLogoFile(null);
    setClubLogoPreview(null);
    setClubForm({
      name: '',
      logo_url: '',
      slug: '',
      location: '',
      address: '',
      city: '',
      max_capacity: 500,
      opening_time: '23:30',
      closing_time: '06:00',
      contact_phone: '',
      is_active: true,
    });
    setShowClubModal(true);
  };

  const handleOpenEditClub = (club: ClubItem) => {
    setEditingClub(club);
    setClubLogoFile(null);
    setClubLogoPreview(club.logo_url || null);
    setClubForm({
      name: club.name,
      logo_url: club.logo_url || '',
      slug: club.slug,
      location: club.location || '',
      address: club.address || '',
      city: club.city || '',
      max_capacity: club.max_capacity,
      opening_time: club.opening_time || '23:30',
      closing_time: club.closing_time || '06:00',
      contact_phone: club.contact_phone || '',
      is_active: club.is_active,
    });
    setShowClubModal(true);
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setClubSubmitting(true);
      setError(null);

      const url = editingClub ? `/superadmin/clubs/${editingClub.id}` : '/superadmin/clubs';
      
      const formData = new FormData();
      formData.append('name', clubForm.name);
      formData.append('slug', clubForm.slug);
      formData.append('location', clubForm.location);
      formData.append('address', clubForm.address);
      formData.append('city', clubForm.city);
      formData.append('max_capacity', String(clubForm.max_capacity));
      formData.append('opening_time', clubForm.opening_time);
      formData.append('closing_time', clubForm.closing_time);
      formData.append('contact_phone', clubForm.contact_phone);
      formData.append('is_active', clubForm.is_active ? '1' : '0');

      if (clubLogoFile) {
        formData.append('logo_file', clubLogoFile);
      } else {
        formData.append('logo_url', clubForm.logo_url);
      }

      const response = await apiFetch(url, {
        method: 'POST',
        body: formData,
      });

      if (response.status === 'success') {
        setShowClubModal(false);
        showNotification(editingClub ? 'Clube atualizado com sucesso!' : 'Novo clube criado com sucesso!');
        fetchSuperAdminData();
      } else {
        setError(response.message || 'Erro ao guardar clube.');
      }
    } catch (err: any) {
      console.error('Error saving club:', err);
      setError('Erro ao comunicar com o servidor.');
    } finally {
      setClubSubmitting(false);
    }
  };

  const handleToggleClubStatus = async (clubId: number) => {
    try {
      const response = await apiFetch(`/superadmin/clubs/${clubId}/toggle-status`, {
        method: 'POST',
      });

      if (response.status === 'success') {
        showNotification(response.message);
        fetchSuperAdminData();
      } else {
        setError(response.message || 'Erro ao alterar estado do clube.');
      }
    } catch (err: any) {
      console.error('Error toggling club status:', err);
      setError('Falha ao comunicar com o servidor.');
    }
  };

  // User & Permission Handlers
  const handleToggleSuperAdmin = async (userId: number) => {
    try {
      const response = await apiFetch('/superadmin/users/toggle-superadmin', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.status === 'success') {
        showNotification(response.message);
        fetchSuperAdminData();
      } else {
        setError(response.message || 'Erro ao alterar privilégios.');
      }
    } catch (err: any) {
      console.error('Error toggling superadmin:', err);
      setError('Falha ao comunicar com o servidor.');
    }
  };

  const handleOpenAssignRole = (user: UserItem) => {
    setSelectedUserForAssign(user);
    setAssignForm({
      club_id: clubs.length > 0 ? clubs[0].id : 0,
      role: 'ADMIN',
    });
    setShowAssignModal(true);
  };

  const handleSaveAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAssign || !assignForm.club_id) return;

    try {
      const response = await apiFetch('/superadmin/users/assign-role', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUserForAssign.id,
          club_id: assignForm.club_id,
          role: assignForm.role,
        }),
      });

      if (response.status === 'success') {
        setShowAssignModal(false);
        showNotification(`Permissão de ${assignForm.role} atribuída com sucesso!`);
        fetchSuperAdminData();
      } else {
        setError(response.message || 'Erro ao atribuir permissão.');
      }
    } catch (err: any) {
      console.error('Error assigning role:', err);
      setError('Falha ao comunicar com o servidor.');
    }
  };

  const handleRemoveClubAccess = async (userId: number, clubId: number) => {
    if (!confirm('Tens a certeza que desejas remover o acesso deste utilizador a este clube?')) return;

    try {
      const response = await apiFetch('/superadmin/users/remove-access', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, club_id: clubId }),
      });

      if (response.status === 'success') {
        showNotification('Acesso revogado com sucesso.');
        fetchSuperAdminData();
      } else {
        setError(response.message || 'Erro ao revogar acesso.');
      }
    } catch (err: any) {
      console.error('Error removing access:', err);
      setError('Falha ao comunicar com o servidor.');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdminSubmitting(true);
      setError(null);

      const response = await apiFetch('/superadmin/users/create-admin', {
        method: 'POST',
        body: JSON.stringify({
          name: createAdminForm.name,
          email: createAdminForm.email,
          password: createAdminForm.password,
          club_id: createAdminForm.club_id ? parseInt(createAdminForm.club_id) : null,
          role: createAdminForm.role,
        }),
      });

      if (response.status === 'success') {
        setShowCreateAdminModal(false);
        setCreateAdminForm({ name: '', email: '', password: '', club_id: '', role: 'ADMIN' });
        showNotification('Novo administrador criado com sucesso!');
        fetchSuperAdminData();
      } else {
        setError(response.message || 'Erro ao criar administrador.');
      }
    } catch (err: any) {
      console.error('Error creating admin:', err);
      setError('Falha ao comunicar com o servidor.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  // Filtered lists
  const filteredClubs = clubs.filter((c) => {
    const q = clubSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.city && c.city.toLowerCase().includes(q));
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);

    let matchesClub = true;
    if (userClubFilter !== 'all') {
      matchesClub = u.club_access.some((acc) => acc.club_id === parseInt(userClubFilter));
    }

    let matchesRole = true;
    if (userRoleFilter !== 'all') {
      if (userRoleFilter === 'SUPERADMIN') {
        matchesRole = u.is_superadmin;
      } else {
        matchesRole = u.club_access.some((acc) => acc.role === userRoleFilter);
      }
    }

    return matchesSearch && matchesClub && matchesRole;
  });

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-xs font-semibold">A carregar Painel SuperAdmin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold underline">Fechar</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-xs font-bold underline">Fechar</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#FFD700] text-black shadow-lg">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-2xl sm:text-3xl font-black text-white tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Painel SuperAdmin
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  Global
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Gestão centralizada de todos os clubes, criação de estabelecimentos e controlo de permissões
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenCreateClub}
            className="px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              color: '#000000',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Criar Clube</span>
          </button>
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-[#D4AF37]" />
            <span>Criar Administrador</span>
          </button>
        </div>
      </div>

      {/* Global Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Clubes na Rede */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Clubes na Rede</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">{overview?.total_clubs || 0}</div>
            <p className="text-[10px] text-green-400 font-medium mt-1">
              🟢 {overview?.active_clubs || 0} ativos na plataforma
            </p>
          </div>
        </div>

        {/* Card 2: Administradores */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Administradores</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {overview?.total_admins || 0}
            </div>
            <p className="text-[10px] text-[#D4AF37] font-medium mt-1">
              👑 {overview?.superadmins_count || 1} SuperAdmins Globais
            </p>
          </div>
        </div>

        {/* Card 3: Equipas & RPs Globais */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Staff & Promotores</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {(overview?.total_staff || 0) + (overview?.total_rps || 0)}
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              {overview?.total_staff || 0} Staff • {overview?.total_rps || 0} RPs
            </p>
          </div>
        </div>

        {/* Card 4: Utilizadores Globais */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Utilizadores</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500/15 border border-green-500/30 text-green-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#D4AF37]">
              {(overview?.total_users || 0).toLocaleString('pt-PT')}
            </div>
            <p className="text-[10px] text-green-400 font-medium mt-1">
              +{overview?.new_users_30d || 0} novos utilizadores (30d)
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('clubs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'clubs'
              ? 'bg-[#D4AF37] text-black shadow-md'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gestão de Clubes ({clubs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'bg-[#D4AF37] text-black shadow-md'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Permissões & Administradores ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: GESTÃO DE CLUBES */}
      {activeTab === 'clubs' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={clubSearch}
                onChange={(e) => setClubSearch(e.target.value)}
                placeholder="Pesquisar clube por nome, slug ou cidade..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-xs placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              A mostrar {filteredClubs.length} de {clubs.length} clubes
            </span>
          </div>

          {/* Clubs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClubs.map((club) => (
              <div
                key={club.id}
                className="p-5 rounded-2xl bg-[#141414] border border-white/10 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-16 rounded-2xl bg-black/90 border border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-lg p-1.5 group-hover:border-[#D4AF37]/50 transition-colors">
                        {club.logo_url ? (
                          <img
                            src={club.logo_url}
                            alt={club.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-[#D4AF37]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors truncate">
                          {club.name}
                        </h3>
                        <p className="text-xs text-[#D4AF37] font-mono font-medium">/{club.slug}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        club.is_active
                          ? 'bg-green-500/15 text-green-400 border-green-500/20'
                          : 'bg-red-500/15 text-red-400 border-red-500/20'
                      }`}
                    >
                      {club.is_active ? 'Ativo' : 'Suspenso'}
                    </span>
                  </div>

                  {/* Club details */}
                  <div className="space-y-1.5 text-xs text-gray-400 mb-4">
                    {club.city && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        <span>{club.city} {club.location ? `• ${club.location}` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <span>Lotação Máx: <b className="text-white">{club.max_capacity} pax</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>{club.opening_time || '23:30'} às {club.closing_time || '06:00'}</span>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center mb-4">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Admins</span>
                      <span className="text-xs font-bold text-[#D4AF37]">{club.admins?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Staff Porta</span>
                      <span className="text-xs font-bold text-blue-400">{club.staff_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">RPs / Chefes</span>
                      <span className="text-xs font-bold text-amber-400">{club.rp_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleOpenEditClub(club)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleToggleClubStatus(club.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      club.is_active
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    }`}
                    title={club.is_active ? 'Desativar Clube' : 'Ativar Clube'}
                  >
                    {club.is_active ? 'Suspender' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSÕES & ADMINISTRADORES */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Pesquisar por nome ou email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-xs placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={userClubFilter}
                onChange={(e) => setUserClubFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="all">Todos os Clubes</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="all">Todos os Cargos</option>
                <option value="SUPERADMIN">SuperAdmin</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
                <option value="TEAM_LEADER">Chefe de Equipa</option>
                <option value="RP">RP</option>
                <option value="CLIENT">Cliente</option>
              </select>
            </div>
          </div>

          {/* Users Permissions Table */}
          <div className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/10 text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Utilizador</th>
                    <th className="px-4 py-3.5">Privilégio Global</th>
                    <th className="px-4 py-3.5">Acessos a Clubes</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* User Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{user.name}</span>
                            <span className="text-[11px] text-gray-400 font-mono">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* SuperAdmin Badge / Toggle */}
                      <td className="px-4 py-4">
                        {user.is_superadmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm">
                            <Crown className="w-3 h-3 text-[#D4AF37]" />
                            SuperAdmin
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-500">Padrão</span>
                        )}
                      </td>

                      {/* Club Access List */}
                      <td className="px-4 py-4">
                        {user.club_access.length === 0 ? (
                          <span className="text-[11px] text-gray-500 italic">Sem acessos definidos</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {user.club_access.map((acc, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white/5 border border-white/10 text-gray-300"
                              >
                                <span className="font-bold text-white">{acc.club_name}:</span>
                                <span className={
                                  acc.role === 'ADMIN' ? 'text-[#D4AF37]' :
                                  acc.role === 'STAFF' ? 'text-blue-400' :
                                  acc.role === 'RP' || acc.role === 'TEAM_LEADER' ? 'text-amber-400' : 'text-gray-400'
                                }>
                                  {acc.role}
                                </span>
                                <button
                                  onClick={() => handleRemoveClubAccess(user.id, acc.club_id)}
                                  className="text-gray-500 hover:text-red-400 transition-colors ml-0.5"
                                  title="Remover acesso a este clube"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAssignRole(user)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-colors"
                          >
                            + Atribuir Cargo
                          </button>
                          <button
                            onClick={() => handleToggleSuperAdmin(user.id)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                              user.is_superadmin
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20'
                            }`}
                          >
                            {user.is_superadmin ? 'Revogar SuperAdmin' : 'Tornar SuperAdmin'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR CLUBE */}
      {showClubModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(20px)' }}
          onClick={() => setShowClubModal(false)}
        >
          <div
            className="w-full max-w-xl p-6 sm:p-8 rounded-[2rem] border border-[#D4AF37]/30 shadow-2xl"
            style={{
              background: 'rgba(15, 15, 15, 0.98)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl sm:text-2xl font-black text-white mb-5">
              {editingClub ? `Editar Clube: ${editingClub.name}` : 'Criar Novo Clube'}
            </h2>
            <form onSubmit={handleSaveClub} className="space-y-4">
              {/* Club Logo Upload */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Logótipo do Clube (Upload ou Link)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {clubLogoPreview ? (
                      <img
                        src={clubLogoPreview}
                        alt="Logo"
                        className="w-full h-full object-cover"
                        onError={() => setClubLogoPreview(null)}
                      />
                    ) : (
                      <Building2 className="w-7 h-7 text-[#D4AF37]/50" />
                    )}
                    {clubLogoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setClubLogoFile(null);
                          setClubLogoPreview(null);
                          setClubForm({ ...clubForm, logo_url: '' });
                          if (clubFileInputRef.current) clubFileInputRef.current.value = '';
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                        title="Remover logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        ref={clubFileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setClubLogoFile(file);
                            setClubLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => clubFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Ficheiro</span>
                      </button>
                      {clubLogoFile && (
                        <span className="text-[11px] text-green-400 truncate max-w-[160px]">
                          ✓ {clubLogoFile.name}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Link className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ou URL da imagem (https://...)"
                        value={clubForm.logo_url}
                        onChange={(e) => {
                          setClubForm({ ...clubForm, logo_url: e.target.value });
                          setClubLogoFile(null);
                          setClubLogoPreview(e.target.value || null);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nome do Clube *</label>
                  <input
                    type="text"
                    value={clubForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClubForm({
                        ...clubForm,
                        name: val,
                        slug: editingClub ? clubForm.slug : val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Ex: Eskada Porto"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Slug URL (/slug) *</label>
                  <input
                    type="text"
                    value={clubForm.slug}
                    onChange={(e) => setClubForm({ ...clubForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-mono focus:border-[#D4AF37] focus:outline-none"
                    placeholder="eskada"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={clubForm.city}
                    onChange={(e) => setClubForm({ ...clubForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Porto"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Localização / Zona</label>
                  <input
                    type="text"
                    value={clubForm.location}
                    onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Rua da Alegria, 660"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Lotação Máx *</label>
                  <input
                    type="number"
                    value={clubForm.max_capacity}
                    onChange={(e) => setClubForm({ ...clubForm, max_capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Abertura</label>
                  <input
                    type="time"
                    value={clubForm.opening_time}
                    onChange={(e) => setClubForm({ ...clubForm, opening_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Encerramento</label>
                  <input
                    type="time"
                    value={clubForm.closing_time}
                    onChange={(e) => setClubForm({ ...clubForm, closing_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Telefone de Contacto</label>
                <input
                  type="text"
                  value={clubForm.contact_phone}
                  onChange={(e) => setClubForm({ ...clubForm, contact_phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  placeholder="+351 912 345 678"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="club_active"
                  checked={clubForm.is_active}
                  onChange={(e) => setClubForm({ ...clubForm, is_active: e.target.checked })}
                  className="rounded bg-white/10 border-white/20 text-[#D4AF37] focus:ring-0"
                />
                <label htmlFor="club_active" className="text-xs text-gray-300 font-medium">
                  Clube ativo e visível na seleção de estabelecimentos
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowClubModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clubSubmitting}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                  }}
                >
                  {clubSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingClub ? 'Guardar Alterações' : 'Criar Clube'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATRIBUIR CARGO A UTILIZADOR */}
      {showAssignModal && selectedUserForAssign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(20px)' }}
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="w-full max-w-md p-6 rounded-[2rem] border border-[#D4AF37]/30 shadow-2xl"
            style={{ background: 'rgba(15, 15, 15, 0.98)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-2">Atribuir Cargo</h2>
            <p className="text-xs text-gray-400 mb-5">
              Utilizador: <b className="text-white">{selectedUserForAssign.name}</b> ({selectedUserForAssign.email})
            </p>

            <form onSubmit={handleSaveAssignRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Clube</label>
                <select
                  value={assignForm.club_id}
                  onChange={(e) => setAssignForm({ ...assignForm, club_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  required
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (/{c.slug})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cargo no Clube</label>
                <select
                  value={assignForm.role}
                  onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="ADMIN">ADMIN (Gestor total do clube)</option>
                  <option value="STAFF">STAFF (Portaria / Validação)</option>
                  <option value="TEAM_LEADER">TEAM LEADER (Chefe de Equipa RP)</option>
                  <option value="RP">RP (Relações Públicas / Promotor)</option>
                  <option value="CLIENT">CLIENT (Cliente normal)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-[#D4AF37] hover:bg-[#FFD700] text-black transition-all"
                >
                  Confirmar Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO ADMINISTRADOR */}
      {showCreateAdminModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(20px)' }}
          onClick={() => setShowCreateAdminModal(false)}
        >
          <div
            className="w-full max-w-md p-6 sm:p-8 rounded-[2rem] border border-[#D4AF37]/30 shadow-2xl"
            style={{ background: 'rgba(15, 15, 15, 0.98)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-1">Criar Novo Administrador</h2>
            <p className="text-xs text-gray-400 mb-5">
              Cria uma conta de administrador ou superadministrador diretamente
            </p>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={createAdminForm.name}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Nome do Administrador"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email *</label>
                <input
                  type="email"
                  value={createAdminForm.email}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  placeholder="admin@vibe.pt"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password *</label>
                <input
                  type="password"
                  value={createAdminForm.password}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de Permissão</label>
                <select
                  value={createAdminForm.role}
                  onChange={(e) => setCreateAdminForm({ ...createAdminForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="ADMIN">ADMIN (Administrador de um Clube)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Acesso total à rede VIBE)</option>
                  <option value="STAFF">STAFF (Portaria / Validação)</option>
                </select>
              </div>

              {createAdminForm.role !== 'SUPERADMIN' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Atribuir ao Clube</label>
                  <select
                    value={createAdminForm.club_id}
                    onChange={(e) => setCreateAdminForm({ ...createAdminForm, club_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#D4AF37] focus:outline-none"
                    required
                  >
                    <option value="">Seleciona um clube...</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id.toString()}>{c.name} (/{c.slug})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adminSubmitting}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-[#D4AF37] hover:bg-[#FFD700] text-black transition-all flex items-center justify-center gap-1.5"
                >
                  {adminSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
