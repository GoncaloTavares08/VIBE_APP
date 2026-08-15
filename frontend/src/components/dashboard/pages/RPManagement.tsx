import { useState, useEffect, useMemo } from 'react';
import {
  Edit,
  Award,
  X,
  Check,
  Search,
  UserPlus,
  AlertCircle,
  Users,
  Crown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { apiFetch } from '../../../services/api';

interface RP {
  id: number;
  name: string;
  email: string;
  role: 'RP' | 'TEAM_LEADER';
  team_leader_id?: number;
  team_leader_name?: string;
  guestsTonight: number;
  checkedInTonight?: number;
  totalGuests?: number;
  totalCheckedIn?: number;
  totalRevenue: number;
  revenueTonight?: number;
  points?: number;
  avatar: string;
  profile_photo?: string | null;
}

interface SearchedClient {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  profile_photo?: string | null;
}

export function RPManagement() {
  const [activeTab, setActiveTab] = useState<'promoters' | 'leaders'>('promoters');
  const [editingRP, setEditingRP] = useState<RP | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  const [rps, setRps] = useState<RP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters for RPs list
  const [rpSearch, setRpSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'RP' | 'TEAM_LEADER' | 'unassigned'>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'tonight' | 'total' | 'name'>('total');

  // Search & Expanded Team for Leaders
  const [leaderSearch, setLeaderSearch] = useState('');
  const [expandedLeaderId, setExpandedLeaderId] = useState<number | null>(null);

  // Promote Client search
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [searchedClients, setSearchedClients] = useState<SearchedClient[]>([]);
  const [selectedClientToPromote, setSelectedClientToPromote] = useState<SearchedClient | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<'RP' | 'TEAM_LEADER' | 'CLIENT'>('RP');
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchRPs();
  }, []);

  const fetchRPs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/admin/rps', { method: 'GET' });
      if (data.status === 'success') {
        setRps(data.data || []);
      } else {
        setError(data.message || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const teamLeaders = useMemo(() => {
    return rps.filter(rp => rp.role === 'TEAM_LEADER');
  }, [rps]);

  // Filtered & Sorted RPs List
  const filteredRps = useMemo(() => {
    return rps
      .filter((rp) => {
        // Search term filter
        if (rpSearch.trim()) {
          const q = rpSearch.toLowerCase().trim();
          const matchName = rp.name.toLowerCase().includes(q);
          const matchEmail = rp.email.toLowerCase().includes(q);
          const matchLeader = rp.team_leader_name?.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchLeader) return false;
        }

        // Role filter
        if (roleFilter === 'RP') return rp.role === 'RP';
        if (roleFilter === 'TEAM_LEADER') return rp.role === 'TEAM_LEADER';
        if (roleFilter === 'unassigned') return rp.role === 'RP' && !rp.team_leader_id;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'tonight') return b.guestsTonight - a.guestsTonight;
        if (sortBy === 'total') return (b.totalGuests || 0) - (a.totalGuests || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [rps, rpSearch, roleFilter, sortBy]);

  // Filtered Leaders List
  const filteredLeaders = useMemo(() => {
    return teamLeaders.filter((leader) => {
      if (!leaderSearch.trim()) return true;
      const q = leaderSearch.toLowerCase().trim();
      const matchLeaderName = leader.name.toLowerCase().includes(q);
      const matchLeaderEmail = leader.email.toLowerCase().includes(q);

      // Check if any team member matches
      const teamMembers = rps.filter(rp => rp.team_leader_id === leader.id);
      const matchMember = teamMembers.some(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));

      return matchLeaderName || matchLeaderEmail || matchMember;
    });
  }, [teamLeaders, rps, leaderSearch]);

  // Aggregated totals
  const totalStats = useMemo(() => {
    const guestsTonight = rps.reduce((acc, rp) => acc + rp.guestsTonight, 0);
    const totalGuests = rps.reduce((acc, rp) => acc + (rp.totalGuests || 0), 0);
    const totalRevenue = rps.reduce((acc, rp) => acc + rp.totalRevenue, 0);
    return { guestsTonight, totalGuests, totalRevenue };
  }, [rps]);

  const handleEdit = (rp: RP) => {
    setEditingRP(rp);
    setSelectedRole(rp.role);
    setSelectedTeamLeader(rp.team_leader_id || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRP(null);
    setSelectedRole('RP');
    setSelectedTeamLeader(null);
    setSaveLoading(false);
  };

  const handleSaveRole = async () => {
    if (!editingRP) return;

    if (selectedRole === 'RP' && !selectedTeamLeader) {
      alert('Um RP deve estar associado a um Chefe de Equipa');
      return;
    }

    setSaveLoading(true);
    try {
      const data = await apiFetch('/admin/rps/update-role', {
        method: 'POST',
        body: JSON.stringify({
          user_id: editingRP.id,
          new_role: selectedRole,
          team_leader_id: selectedRole === 'RP' ? selectedTeamLeader : null
        })
      });

      if (data.status === 'success') {
        await fetchRPs();
        handleCloseModal();
      } else {
        alert(data.message || 'Erro ao atualizar cargo');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar cargo');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSearchClients = async () => {
    if (!clientSearchQuery.trim()) {
      setSearchError('Insere um nome ou email para pesquisar');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchedClients([]);
    setSelectedClientToPromote(null);

    try {
      const data = await apiFetch('/admin/rps/search', {
        method: 'POST',
        body: JSON.stringify({ query: clientSearchQuery.trim() })
      });

      if (data.status === 'success') {
        if (data.results && data.results.length > 0) {
          setSearchedClients(data.results);
          setSelectedClientToPromote(data.results[0]);
        } else if (data.data) {
          setSearchedClients([data.data]);
          setSelectedClientToPromote(data.data);
        }
      } else {
        setSearchError(data.message || 'Nenhum cliente encontrado');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Erro na pesquisa');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOpenPromoteModal = (client: SearchedClient) => {
    setSelectedClientToPromote(client);
    setSelectedRole('RP');
    setSelectedTeamLeader(null);
    setShowPromoteModal(true);
  };

  const handleConfirmPromote = async () => {
    if (!selectedClientToPromote || !selectedTeamLeader) return;

    setSaveLoading(true);
    try {
      const data = await apiFetch('/admin/rps/promote', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedClientToPromote.id,
          team_leader_id: selectedTeamLeader
        })
      });

      if (data.status === 'success') {
        await fetchRPs();
        setShowPromoteModal(false);
        setSelectedClientToPromote(null);
        setSearchedClients([]);
        setClientSearchQuery('');
        alert('Cliente promovido a RP com sucesso!');
      } else {
        alert(data.message || 'Erro ao promover cliente');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao promover cliente');
    } finally {
      setSaveLoading(false);
    }
  };

  const renderProfileAvatar = (
    name: string,
    avatar: string,
    photo?: string | null,
    sizeClass = 'w-11 h-11',
    isLeader = false
  ) => {
    if (photo) {
      return (
        <div className={`${sizeClass} rounded-2xl overflow-hidden border border-white/20 bg-black/40 flex-shrink-0 relative`}>
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      );
    }

    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center font-black text-xs shadow-md flex-shrink-0`}
        style={{
          background: isLeader ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)',
          color: isLeader ? '#000000' : '#ffffff'
        }}
      >
        {avatar || name.charAt(0)}
      </div>
    );
  };

  if (loading && rps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && rps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 max-w-md">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-bold text-base mb-1">Erro ao Carregar RPs</p>
          <p className="text-gray-400 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Gestão de RPs e Equipas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
            Gere a estrutura da tua equipa, pesquise promotores e acompanhe resultados
          </p>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/10">
          <p className="text-[11px] font-semibold uppercase text-gray-400">Total Promotores</p>
          <p className="text-2xl font-black text-white mt-1">{rps.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{teamLeaders.length} chefes de equipa</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/10">
          <p className="text-[11px] font-semibold uppercase text-gray-400">Total Convidados</p>
          <p className="text-2xl font-black text-white mt-1">{totalStats.totalGuests.toLocaleString('pt-PT')} pax</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Histórico acumulado</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/10">
          <p className="text-[11px] font-semibold uppercase text-gray-400">Convidados Último Evento</p>
          <p className="text-2xl font-black text-white mt-1">{totalStats.guestsTonight} pax</p>
          <p className="text-[10px] text-green-400 font-bold mt-0.5">Check-ins na porta</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/10">
          <p className="text-[11px] font-semibold uppercase text-gray-400">Consumo Bar Gerado</p>
          <p className="text-2xl font-black text-[#D4AF37] mt-1">€{totalStats.totalRevenue.toLocaleString('pt-PT')}</p>
          <p className="text-[10px] text-green-400/90 font-medium mt-0.5">Vendas totais de bar</p>
        </div>
      </div>

      {/* Promote Client Card */}
      <div className="p-5 sm:p-7 rounded-[2rem] bg-[#141414] border border-[#D4AF37]/30">
        <h3 className="text-base sm:text-lg font-black text-white mb-3 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#D4AF37]" />
          Promover Cliente a RP
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Pesquisar cliente por nome ou email (ex: joao@email.com)..."
              value={clientSearchQuery}
              onChange={(e) => setClientSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClients()}
              className="w-full px-5 py-3.5 rounded-2xl outline-none bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:border-[#D4AF37]/50 transition-colors text-sm"
            />
            {clientSearchQuery && (
              <button
                onClick={() => {
                  setClientSearchQuery('');
                  setSearchedClients([]);
                  setSearchError(null);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearchClients}
            disabled={searchLoading}
            className="px-6 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap shadow-md text-sm cursor-pointer"
          >
            <Search className="w-4 h-4" />
            {searchLoading ? 'A pesquisar...' : 'Pesquisar'}
          </button>
        </div>

        {searchError && (
          <p className="mt-3 text-xs text-red-400 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {searchError}
          </p>
        )}

        {searchedClients.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-400 font-semibold">Resultados encontrados ({searchedClients.length}):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchedClients.map((client) => (
                <div
                  key={client.id}
                  className="p-3.5 rounded-2xl flex items-center justify-between gap-3 bg-white/[0.02] border border-white/10 hover:border-[#D4AF37]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderProfileAvatar(client.name, client.avatar, client.profile_photo, 'w-10 h-10')}
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{client.name}</p>
                      <p className="text-xs text-gray-400 truncate">{client.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenPromoteModal(client)}
                    className="px-3.5 py-2 rounded-xl font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 transition-colors text-xs whitespace-nowrap"
                  >
                    Promover
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1.5 rounded-2xl bg-[#141414] border border-white/10 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('promoters')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'promoters'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Promotores & Ranking ({rps.length})
        </button>
        <button
          onClick={() => setActiveTab('leaders')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'leaders'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Chefes de Equipa ({teamLeaders.length})
        </button>
      </div>

      {/* SECTION 1: CHEFES DE EQUIPA (with search and team member drawers) */}
      {activeTab === 'leaders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#FFD700]" />
              Chefes de Equipa ({filteredLeaders.length})
            </h2>

            {/* Dedicated Search in Leaders */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar chefes ou equipa..."
                value={leaderSearch}
                onChange={(e) => setLeaderSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[#141414] border border-white/10 text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]/50"
              />
              {leaderSearch && (
                <button
                  onClick={() => setLeaderSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filteredLeaders.map((leader) => {
              const teamMembers = rps.filter((rp) => rp.team_leader_id === leader.id);
              const teamTotalRevenue = teamMembers.reduce((acc, rp) => acc + rp.totalRevenue, 0) + leader.totalRevenue;
              const teamGuestsTonight = teamMembers.reduce((acc, rp) => acc + rp.guestsTonight, 0) + leader.guestsTonight;
              const teamTotalGuests = teamMembers.reduce((acc, rp) => acc + (rp.totalGuests || 0), 0) + (leader.totalGuests || 0);
              const isExpanded = expandedLeaderId === leader.id;

              return (
                <div
                  key={leader.id}
                  className="p-5 sm:p-6 rounded-[2rem] bg-[#141414] border border-[#D4AF37]/30 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3.5">
                        {renderProfileAvatar(leader.name, leader.avatar, leader.profile_photo, 'w-12 h-12', true)}
                        <div>
                          <p className="font-black text-white text-sm sm:text-base">{leader.name}</p>
                          <p className="text-xs text-gray-400">{leader.email}</p>
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 mt-1">
                            <Award className="w-3 h-3" />
                            Chefe de Equipa
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Convidados</span>
                        <span className="text-white font-bold">{teamTotalGuests} pax</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Convidados Último Evento</span>
                        <span className="text-white font-black">{teamGuestsTonight} pax</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Consumo Bar da Equipa</span>
                        <span className="text-[#D4AF37] font-black">€{teamTotalRevenue.toLocaleString('pt-PT')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Membros na Equipa</span>
                        <span className="text-white font-bold">{teamMembers.length} RPs (+ líder)</span>
                      </div>
                    </div>

                    {/* Team Members Drawer */}
                    {isExpanded && (
                      <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">Membros da Equipa ({teamMembers.length}):</p>
                        {teamMembers.length > 0 ? (
                          teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.02]">
                              <div className="flex items-center gap-2 min-w-0">
                                {renderProfileAvatar(member.name, member.avatar, member.profile_photo, 'w-7 h-7')}
                                <p className="text-xs font-bold text-white truncate">{member.name}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-[11px] font-bold text-white">{member.totalGuests || 0} total</span>
                                <span className="text-[10px] text-[#D4AF37] block">€{member.totalRevenue}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 py-2 text-center">Nenhum RP associado a esta equipa.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setExpandedLeaderId(isExpanded ? null : leader.id)}
                      className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Ocultar Membros' : `Ver Membros (${teamMembers.length})`}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(leader)}
                      className="px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37]/25 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Gerir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLeaders.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-xs bg-[#141414] rounded-2xl border border-white/10">
              Nenhum chefe de equipa encontrado com a pesquisa "{leaderSearch}".
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PROMOTERS LIST & RANKING */}
      {activeTab === 'promoters' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D4AF37]" />
              Promotores & Ranking ({filteredRps.length})
            </h2>

            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, email, chefe..."
                  value={rpSearch}
                  onChange={(e) => setRpSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[#141414] border border-white/10 text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]/50"
                />
                {rpSearch && (
                  <button
                    onClick={() => setRpSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role filter dropdown */}
              <div className="flex items-center gap-1 bg-[#141414] border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-transparent text-white text-xs outline-none cursor-pointer py-1"
                >
                  <option value="all" className="bg-black">Todos os Cargos</option>
                  <option value="RP" className="bg-black">Apenas RPs</option>
                  <option value="TEAM_LEADER" className="bg-black">Apenas Chefes</option>
                  <option value="unassigned" className="bg-black">Sem Chefe Atribuído</option>
                </select>
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-1 bg-[#141414] border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white text-xs outline-none cursor-pointer py-1"
                >
                  <option value="revenue" className="bg-black">Mais Consumo (€)</option>
                  <option value="total" className="bg-black">Total Convidados</option>
                  <option value="tonight" className="bg-black">Convidados Último Evento</option>
                  <option value="name" className="bg-black">Nome (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          {!isMobile && (
            <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-[#141414]">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="text-left p-4 pl-6">Promotor</th>
                    <th className="text-left p-4">Cargo / Equipa</th>
                    <th className="text-center p-4">Total Convidados</th>
                    <th className="text-center p-4">Convidados Último Evento</th>
                    <th className="text-center p-4">Consumo Bar</th>
                    <th className="text-center p-4 pr-6">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRps.map((rp, index) => (
                    <tr key={rp.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3.5">
                          <span className="w-6 text-center font-black text-sm text-[#D4AF37]">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                          {renderProfileAvatar(rp.name, rp.avatar, rp.profile_photo, 'w-10 h-10', rp.role === 'TEAM_LEADER')}
                          <div>
                            <p className="font-bold text-white text-sm">{rp.name}</p>
                            <p className="text-xs text-gray-400">{rp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              rp.role === 'TEAM_LEADER'
                                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30'
                                : 'bg-white/5 text-gray-300 border-white/10'
                            }`}
                          >
                            {rp.role === 'TEAM_LEADER' ? 'Chefe de Equipa' : 'RP'}
                          </span>
                          {rp.role === 'RP' && (
                            <p className="text-[11px] text-gray-400">
                              {rp.team_leader_name ? `Chefe: ${rp.team_leader_name}` : <span className="text-amber-400/90 font-medium">Sem chefe</span>}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-black text-white text-sm">{(rp.totalGuests || 0).toLocaleString('pt-PT')}</span>
                        {rp.totalCheckedIn !== undefined && rp.totalCheckedIn > 0 && (
                          <span className="block text-[10px] text-gray-400 font-medium">{rp.totalCheckedIn} validados</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-black text-white text-sm">{rp.guestsTonight || 0}</span>
                        {rp.checkedInTonight !== undefined && rp.checkedInTonight > 0 ? (
                          <span className="block text-[10px] text-green-400 font-bold">{rp.checkedInTonight} validados</span>
                        ) : (
                          <span className="block text-[10px] text-gray-500">0 validados</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-black text-[#D4AF37] text-sm">€{rp.totalRevenue.toLocaleString('pt-PT')}</span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <button
                          onClick={() => handleEdit(rp)}
                          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Gerir Cargo e Equipa"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Card View */}
          {isMobile && (
            <div className="space-y-3">
              {filteredRps.map((rp, index) => (
                <div key={rp.id} className="p-4 rounded-2xl border border-white/10 bg-[#141414]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-[#D4AF37]">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      {renderProfileAvatar(rp.name, rp.avatar, rp.profile_photo, 'w-10 h-10', rp.role === 'TEAM_LEADER')}
                      <div>
                        <p className="font-bold text-white text-sm">{rp.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {rp.role === 'TEAM_LEADER' ? 'Chefe de Equipa' : rp.team_leader_name ? `Chefe: ${rp.team_leader_name}` : 'RP (Sem chefe)'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(rp)}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 active:scale-95 text-[#D4AF37]"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
                    <div className="p-2 rounded-xl bg-white/[0.02]">
                      <p className="text-[10px] text-gray-400">Total Conv.</p>
                      <p className="text-sm font-black text-white">{(rp.totalGuests || 0).toLocaleString('pt-PT')}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02]">
                      <p className="text-[10px] text-gray-400">Último Evento</p>
                      <p className="text-sm font-bold text-gray-200">{rp.guestsTonight || 0}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.02]">
                      <p className="text-[10px] text-gray-400">Consumo Bar</p>
                      <p className="text-sm font-black text-[#D4AF37]">€{rp.totalRevenue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredRps.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-xs bg-[#141414] rounded-2xl border border-white/10">
              Nenhum promotor encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      )}

      {/* MODAL: Edit Role & Team Leader */}
      {showModal && editingRP && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-6 rounded-[2rem] border border-[#D4AF37]/30 bg-[#161616] shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white">Editar Promotor</h3>
              <button onClick={handleCloseModal} className="p-1 rounded-full text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              {renderProfileAvatar(editingRP.name, editingRP.avatar, editingRP.profile_photo, 'w-11 h-11', editingRP.role === 'TEAM_LEADER')}
              <div>
                <p className="font-bold text-white text-sm">{editingRP.name}</p>
                <p className="text-xs text-gray-400">{editingRP.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cargo</label>
              <select
                className="w-full p-3 rounded-xl outline-none bg-white/5 border border-white/10 text-white text-xs font-bold"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
              >
                <option value="RP" className="bg-black">RP (Promotor)</option>
                <option value="TEAM_LEADER" className="bg-black">Chefe de Equipa</option>
                <option value="CLIENT" className="bg-black">Despromover a Cliente</option>
              </select>
            </div>

            {selectedRole === 'RP' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Atribuir a Chefe de Equipa <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full p-3 rounded-xl outline-none bg-white/5 border border-white/10 text-white text-xs font-bold"
                  value={selectedTeamLeader || ''}
                  onChange={(e) => setSelectedTeamLeader(Number(e.target.value))}
                >
                  <option value="" className="bg-black">Selecione um Chefe de Equipa</option>
                  {teamLeaders
                    .filter((leader) => leader.id !== editingRP.id)
                    .map((leader) => (
                      <option key={leader.id} value={leader.id} className="bg-black">
                        {leader.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCloseModal}
                disabled={saveLoading}
                className="flex-1 py-2.5 rounded-xl font-bold bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saveLoading}
                className="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs text-black bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:opacity-90 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {saveLoading ? 'A guardar...' : 'Guardar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Promote Client to RP */}
      {showPromoteModal && selectedClientToPromote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowPromoteModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-6 rounded-[2rem] border border-[#D4AF37]/30 bg-[#161616] shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white">Promover a RP</h3>
              <button onClick={() => setShowPromoteModal(false)} className="p-1 rounded-full text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              {renderProfileAvatar(selectedClientToPromote.name, selectedClientToPromote.avatar, selectedClientToPromote.profile_photo, 'w-11 h-11')}
              <div>
                <p className="font-bold text-white text-sm">{selectedClientToPromote.name}</p>
                <p className="text-xs text-gray-400">{selectedClientToPromote.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Atribuir a Chefe de Equipa <span className="text-red-400">*</span>
              </label>
              <select
                className="w-full p-3 rounded-xl outline-none bg-white/5 border border-white/10 text-white text-xs font-bold"
                value={selectedTeamLeader || ''}
                onChange={(e) => setSelectedTeamLeader(Number(e.target.value))}
              >
                <option value="" className="bg-black">Selecione um Chefe de Equipa</option>
                {teamLeaders.map((leader) => (
                  <option key={leader.id} value={leader.id} className="bg-black">
                    {leader.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPromoteModal(false)}
                disabled={saveLoading}
                className="flex-1 py-2.5 rounded-xl font-bold bg-white/5 border border-white/10 text-white text-xs hover:bg-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPromote}
                disabled={saveLoading || !selectedTeamLeader}
                className="flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs text-black bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:opacity-90 shadow-md cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {saveLoading ? 'A promover...' : 'Confirmar Nomeação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

