import { useState, useEffect } from 'react';
import { Users, Euro, Edit, Award, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RP {
  id: number;
  name: string;
  role: 'rp' | 'team_leader';
  team?: string;
  guestsTonight: number;
  totalRevenue: number;
  avatar: string;
}

const mockRPs: RP[] = [
  { id: 1, name: 'Joana Costa', role: 'team_leader', team: 'Golden Squad', guestsTonight: 45, totalRevenue: 890, avatar: 'JC' },
  { id: 2, name: 'Miguel Torres', role: 'rp', team: 'Golden Squad', guestsTonight: 32, totalRevenue: 640, avatar: 'MT' },
  { id: 3, name: 'Sofia Almeida', role: 'rp', team: 'Golden Squad', guestsTonight: 28, totalRevenue: 560, avatar: 'SA' },
  { id: 4, name: 'Pedro Alves', role: 'team_leader', team: 'Vibe Hustlers', guestsTonight: 38, totalRevenue: 760, avatar: 'PA' },
  { id: 5, name: 'Ana Silva', role: 'rp', team: 'Vibe Hustlers', guestsTonight: 25, totalRevenue: 500, avatar: 'AS' },
  { id: 6, name: 'Carlos Mendes', role: 'rp', team: 'Vibe Hustlers', guestsTonight: 22, totalRevenue: 440, avatar: 'CM' },
  { id: 7, name: 'Rita Santos', role: 'rp', guestsTonight: 18, totalRevenue: 360, avatar: 'RS' },
];

export function RPManagement() {
  const [activeTab, setActiveTab] = useState<'all' | 'leaders' | 'performance'>('all');
  const [editingRP, setEditingRP] = useState<RP | null>(null);
  const [showModal, setShowModal] = useState(false);

  // State for responsive view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const teamLeaders = mockRPs.filter(rp => rp.role === 'team_leader');
  const regularRPs = mockRPs.filter(rp => rp.role === 'rp');

  const handleEdit = (rp: RP) => {
    setEditingRP(rp);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRP(null);
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'all': return 'Todos';
      case 'leaders': return 'Chefes de Equipa';
      case 'performance': return 'Performance';
      default: return tab;
    }
  };

  return (
    <div className="space-y-8">
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
              const teamMembers = mockRPs.filter(rp => rp.team === leader.team && rp.role === 'rp');
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

                  <p className="text-sm text-gray-300 font-semibold mb-4">{leader.team}</p>

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
                  {mockRPs.sort((a, b) => b.totalRevenue - a.totalRevenue).map((rp, index) => (
                    <tr key={rp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {activeTab === 'performance' && index < 3 && (
                            <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                          )}
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: rp.role === 'team_leader' ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)', color: rp.role === 'team_leader' ? '#000000' : '#ffffff' }}>
                            {rp.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{rp.name}</p>
                            {rp.team && <p className="text-xs text-gray-400">{rp.team}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: rp.role === 'team_leader' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: rp.role === 'team_leader' ? '#D4AF37' : '#ffffff' }}>
                          {rp.role === 'team_leader' ? 'Chefe de Equipa' : 'RP'}
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
              {mockRPs.sort((a, b) => b.totalRevenue - a.totalRevenue).map((rp, index) => (
                <div key={rp.id} className="p-4 rounded-2xl"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {activeTab === 'performance' && index < 3 && (
                        <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                      )}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: rp.role === 'team_leader' ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' : 'rgba(255, 255, 255, 0.1)', color: rp.role === 'team_leader' ? '#000000' : '#ffffff' }}>
                        {rp.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">{rp.name}</p>
                        <div className="flex items-center gap-2">
                          {rp.team && <p className="text-xs text-gray-400">{rp.team}</p>}
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                            style={{ background: rp.role === 'team_leader' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: rp.role === 'team_leader' ? '#D4AF37' : '#ffffff' }}>
                            {rp.role === 'team_leader' ? 'Chefe' : 'RP'}
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
                    <p className="text-sm text-gray-400">{editingRP.team || 'Sem equipa'}</p>
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
                    defaultValue={editingRP.role}
                  >
                    <option value="rp">RP</option>
                    <option value="team_leader">Chefe de Equipa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Atribuir a Equipa</label>
                  <select
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                    defaultValue={editingRP.team}
                  >
                    <option value="">Sem equipa</option>
                    <option value="Golden Squad">Golden Squad</option>
                    <option value="Vibe Hustlers">Vibe Hustlers</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
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
                    onClick={handleCloseModal}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                      color: '#000000',
                    }}
                  >
                    <Check className="w-5 h-5" />
                    Guardar
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
