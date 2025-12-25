import { useState, useEffect } from 'react';
import { Edit, Award, X, Check, Search, UserPlus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RP {
  id: number;
  name: string;
  email: string;
  role: 'RP' | 'TEAM_LEADER';
  team_leader_id?: number;
  team_leader_name?: string;
  guestsTonight: number; // TODO: Calcular com base em eventos reais
  totalRevenue: number;  // TODO: Calcular com base em eventos reais
  avatar: string;
}

interface SearchedClient {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export function RPManagement() {
  const [activeTab, setActiveTab] = useState<'all' | 'leaders' | 'performance'>('all');
  const [editingRP, setEditingRP] = useState<RP | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  // Data states
  const [rps, setRps] = useState<RP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search client states
  const [searchEmail, setSearchEmail] = useState('');
  const [searchedClient, setSearchedClient] = useState<SearchedClient | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Edit form states
  const [selectedRole, setSelectedRole] = useState<'RP' | 'TEAM_LEADER' | 'CLIENT'>('RP');
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // State for responsive view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getClubSlug = () => {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    return pathSegments[0] || localStorage.getItem('clubSlug') || '';
  };

  // Fetch RPs and Team Leaders
  useEffect(() => {
    fetchRPs();
  }, []);

  const fetchRPs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/controllers/admin_rp_management.php?action=list', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Client-ID': getClubSlug()
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setRps(data.data);
      } else {
        setError(data.message || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const teamLeaders = rps.filter(rp => rp.role === 'TEAM_LEADER');

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

    // Validation: RP must have team leader
    if (selectedRole === 'RP' && !selectedTeamLeader) {
      alert('Um RP deve estar associado a um Team Leader');
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch('/api/controllers/admin_rp_management.php?action=update_role', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': getClubSlug()
        },
        body: JSON.stringify({
          user_id: editingRP.id,
          new_role: selectedRole,
          team_leader_id: selectedRole === 'RP' ? selectedTeamLeader : null
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Refresh list
        await fetchRPs();
        handleCloseModal();
      } else {
        alert(data.message || 'Erro ao atualizar role');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar role');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSearchClient = async () => {
    if (!searchEmail.trim()) {
      setSearchError('Digite um email');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchedClient(null);

    try {
      const response = await fetch('/api/controllers/admin_rp_management.php?action=search_client', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': getClubSlug()
        },
        body: JSON.stringify({ email: searchEmail })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSearchedClient(data.data);
      } else {
        setSearchError(data.message || 'Cliente não encontrado');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Erro ao pesquisar cliente');
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePromoteClient = () => {
    if (searchedClient) {
      setShowPromoteModal(true);
    }
  };

  const handleConfirmPromote = async () => {
    if (!searchedClient || !selectedTeamLeader) {
      alert('Selecione um Team Leader');
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch('/api/controllers/admin_rp_management.php?action=promote_to_rp', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': getClubSlug()
        },
        body: JSON.stringify({
          user_id: searchedClient.id,
          team_leader_id: selectedTeamLeader
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Refresh list and clear search
        await fetchRPs();
        setSearchedClient(null);
        setSearchEmail('');
        setSelectedTeamLeader(null);
        setShowPromoteModal(false);
      } else {
        alert(data.message || 'Erro ao promover cliente');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao promover cliente');
    } finally {
      setSaveLoading(false);
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'all': return 'Todos';
      case 'leaders': return 'Chefes de Equipa';
      case 'performance': return 'Performance';
      default: return tab;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">A carregar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">Erro</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Promote Client Section */}
      <div className="p-6 rounded-3xl" style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
        <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-[#D4AF37]" />
          Promover Cliente a RP
        </h3>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Email do cliente"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchClient()}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            />
          </div>
          <button
            onClick={handleSearchClient}
            disabled={searchLoading}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              color: '#000000'
            }}
          >
            <Search className="w-5 h-5" />
            {searchLoading ? 'A pesquisar...' : 'Pesquisar'}
          </button>
        </div>

        {searchError && (
          <p className="mt-3 text-sm text-red-400">{searchError}</p>
        )}

        {searchedClient && (
          <div className="mt-4 p-4 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}>
                {searchedClient.avatar}
              </div>
              <div>
                <p className="font-bold text-white">{searchedClient.name}</p>
                <p className="text-sm text-gray-400">{searchedClient.email}</p>
              </div>
            </div>
            <button
              onClick={handlePromoteClient}
              className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}
            >
              Promover a RP
            </button>
          </div>
        )}
      </div>

      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {(['all', 'leaders', 'performance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-6 py-3 rounded-xl font-semibold capitalize transition-all duration-300 whitespace-nowrap"
              style={{
                background: activeTab === tab ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: activeTab === tab ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: activeTab === tab ? '#D4AF37' : '#ffffff',
              }}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      {/* Team Leaders Section */}
      {(activeTab === 'all' || activeTab === 'leaders') && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white">Chefes de Equipa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamLeaders.map((leader) => {
              const teamMembers = rps.filter(rp => rp.team_leader_id === leader.id);
              const teamTotal = teamMembers.reduce((acc, rp) => acc + rp.totalRevenue, 0) + leader.totalRevenue;
              const teamGuests = teamMembers.reduce((acc, rp) => acc + rp.guestsTonight, 0) + leader.guestsTonight;

              return (
                <div
                  key={leader.id}
                  className="p-6 rounded-3xl"
                  style={{
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg"
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                          color: '#000000',
                        }}
                      >
                        {leader.avatar}
                      </div>
                      <div>
                        <p className="font-black text-white">{leader.name}</p>
                        <div
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold mt-1"
                          style={{
                            background: 'rgba(212, 175, 55, 0.2)',
                            color: '#D4AF37',
                          }}
                        >
                          <Award className="w-3 h-3" />
                          Chefe de Equipa
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Convidados da Equipa</span>
                      <span className="text-lg font-black text-white">{teamGuests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Receita da Equipa</span>
                      <span className="text-lg font-black text-[#D4AF37]">€{teamTotal}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Tamanho da Equipa</span>
                      <span className="text-lg font-black text-white">{teamMembers.length + 1}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEdit(leader)}
                    className="w-full mt-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-semibold">Gerir</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All RPs Table */}
      {(activeTab === 'all' || activeTab === 'performance') && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white">
            {activeTab === 'performance' ? 'Ranking de Performance' : 'Todos os RPs'}
          </h2>

          {/* Desktop Table View */}
          {!isMobile && (
            <div
              className="rounded-3xl overflow-hidden overflow-x-auto"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">RP</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Cargo</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-400">Convidados Hoje</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-400">Receita Total</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rps.sort((a, b) => b.totalRevenue - a.totalRevenue).map((rp, index) => (
                    <tr key={rp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {activeTab === 'performance' && index < 3 && (
                            <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                          )}
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: rp.role === 'TEAM_LEADER' ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)', color: rp.role === 'TEAM_LEADER' ? '#000000' : '#ffffff' }}>
                            {rp.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{rp.name}</p>
                            {rp.team_leader_name && <p className="text-xs text-gray-400">Equipa: {rp.team_leader_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: rp.role === 'TEAM_LEADER' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: rp.role === 'TEAM_LEADER' ? '#D4AF37' : '#ffffff' }}>
                          {rp.role === 'TEAM_LEADER' ? 'Chefe de Equipa' : 'RP'}
                        </div>
                      </td>
                      <td className="p-4 text-center"><span className="font-black text-white text-lg">{rp.guestsTonight}</span></td>
                      <td className="p-4 text-center"><span className="font-black text-[#D4AF37] text-lg">€{rp.totalRevenue}</span></td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleEdit(rp)} className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <Edit className="w-4 h-4 text-white" />
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
            <div className="space-y-4">
              {rps.sort((a, b) => b.totalRevenue - a.totalRevenue).map((rp, index) => (
                <div key={rp.id} className="p-4 rounded-2xl"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {activeTab === 'performance' && index < 3 && (
                        <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                      )}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: rp.role === 'TEAM_LEADER' ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)', color: rp.role === 'TEAM_LEADER' ? '#000000' : '#ffffff' }}>
                        {rp.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">{rp.name}</p>
                        <div className="flex items-center gap-2">
                          {rp.team_leader_name && <p className="text-xs text-gray-400">Equipa: {rp.team_leader_name}</p>}
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                            style={{ background: rp.role === 'TEAM_LEADER' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: rp.role === 'TEAM_LEADER' ? '#D4AF37' : '#ffffff' }}>
                            {rp.role === 'TEAM_LEADER' ? 'Chefe' : 'RP'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleEdit(rp)} className="p-2 rounded-xl transition-all duration-300 active:scale-95"
                      style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Edit className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-black/20">
                      <p className="text-xs text-gray-400 mb-1">Convidados</p>
                      <p className="text-lg font-black text-white">{rp.guestsTonight}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20">
                      <p className="text-xs text-gray-400 mb-1">Receita</p>
                      <p className="text-lg font-black text-[#D4AF37]">€{rp.totalRevenue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showModal && editingRP && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
            }}
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-8 rounded-3xl"
              style={{
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">Editar Utilizador</h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                      color: '#000000',
                    }}
                  >
                    {editingRP.avatar}
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">{editingRP.name}</p>
                    <p className="text-sm text-gray-400">{editingRP.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Cargo</label>
                  <select
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                  >
                    <option value="RP">RP</option>
                    <option value="TEAM_LEADER">Chefe de Equipa</option>
                    <option value="CLIENT">Cliente</option>
                  </select>

                  {/* Warning if trying to convert Team Leader with RPs */}
                  {editingRP.role === 'TEAM_LEADER' && selectedRole !== 'TEAM_LEADER' && (
                    (() => {
                      const associatedRPs = rps.filter(rp => rp.team_leader_id === editingRP.id);
                      if (associatedRPs.length > 0) {
                        return (
                          <div className="mt-3 p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="text-red-400 font-semibold">Atenção!</p>
                              <p className="text-red-300">
                                Este Team Leader tem {associatedRPs.length} RP(s) associado(s).
                                Reassocie-os a outro Team Leader antes de fazer esta conversão.
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>

                {selectedRole === 'RP' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Atribuir a Team Leader <span className="text-red-400">*</span>
                    </label>
                    <select
                      className="w-full p-3 rounded-xl outline-none"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                      }}
                      value={selectedTeamLeader || ''}
                      onChange={(e) => setSelectedTeamLeader(Number(e.target.value))}
                    >
                      <option value="">Selecione um Team Leader</option>
                      {teamLeaders
                        .filter(leader => leader.id !== editingRP.id)
                        .map((leader) => (
                          <option key={leader.id} value={leader.id}>
                            {leader.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    disabled={saveLoading}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveRole}
                    disabled={saveLoading}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                      color: '#000000',
                    }}
                  >
                    <Check className="w-5 h-5" />
                    {saveLoading ? 'A guardar...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promote Client Modal */}
      <AnimatePresence>
        {showPromoteModal && searchedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
            }}
            onClick={() => setShowPromoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-8 rounded-3xl"
              style={{
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">Promover a RP</h3>
                <button
                  onClick={() => setShowPromoteModal(false)}
                  className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  >
                    {searchedClient.avatar}
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">{searchedClient.name}</p>
                    <p className="text-sm text-gray-400">{searchedClient.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Atribuir a Team Leader <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                    value={selectedTeamLeader || ''}
                    onChange={(e) => setSelectedTeamLeader(Number(e.target.value))}
                  >
                    <option value="">Selecione um Team Leader</option>
                    {teamLeaders.map((leader) => (
                      <option key={leader.id} value={leader.id}>
                        {leader.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPromoteModal(false)}
                    disabled={saveLoading}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmPromote}
                    disabled={saveLoading || !selectedTeamLeader}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                      color: '#000000',
                      opacity: saveLoading || !selectedTeamLeader ? 0.5 : 1
                    }}
                  >
                    <UserPlus className="w-5 h-5" />
                    {saveLoading ? 'A promover...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
