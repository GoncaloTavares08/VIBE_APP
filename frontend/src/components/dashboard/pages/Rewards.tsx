import { useState, useEffect, useRef } from 'react';
import { Gift, Plus, X, Upload, Package, Edit, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../../../services/api';
import { processHeicFile } from '../../../utils/imageUtils';

interface Reward {
  id: number;
  name: string;
  points: number;
  stock: number;
  available: boolean;
  image_path: string | null;
  description: string;
}

export function Rewards() {
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/admin/rewards', {
        method: 'GET'
      });

      if (data.status === 'success') {
        setRewards(data.data || []);
      } else {
        setError(data.message || 'Erro ao carregar prémios');
      }
    } catch (err: any) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id: number) => {
    try {
      const data = await apiFetch('/admin/rewards/toggle-availability', {
        method: 'POST',
        body: JSON.stringify({ id })
      });

      if (data.status === 'success') {
        setRewards(rewards.map(reward =>
          reward.id === id ? { ...reward, available: !reward.available } : reward
        ));
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ficheiro muito grande. Máximo: 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openAddModal = () => {
    setEditingReward(null);
    setName('');
    setDescription('');
    setPoints('');
    setStock('');
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setName(reward.name);
    setDescription(reward.description);
    setPoints(reward.points.toString());
    setStock(reward.stock.toString());
    setImageFile(null);
    setImagePreview(reward.image_path ? `/api/serve-image?file=${reward.image_path}` : null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !points || !stock) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('points', points);
    formData.append('stock', stock);

    if (imageFile) {
      try {
        const processedFile = await processHeicFile(imageFile);
        formData.append('image', processedFile);
      } catch (err) {
        alert('Erro ao converter formato da imagem do iPhone');
        setSaving(false);
        return;
      }
    }

    if (editingReward) {
      formData.append('id', editingReward.id.toString());
    }

    const endpoint = editingReward ? '/admin/rewards/update' : '/admin/rewards';
    const method = 'POST';

    try {
      const data = await apiFetch(endpoint, {
        method: method,
        body: formData
      });

      if (data.status === 'success') {
        await fetchRewards();
        setShowModal(false);
      } else {
        alert(data.message || 'Erro ao guardar prémio');
      }
    } catch (err) {
      alert('Erro ao conectar ao servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const data = await apiFetch('/admin/rewards/delete', {
        method: 'POST',
        body: JSON.stringify({ id })
      });

      if (data.status === 'success') {
        setRewards(rewards.filter(r => r.id !== id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      alert('Erro ao remover prémio');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">A carregar prémios...</p>
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
              Catálogo de Prémios VIP
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
            Gere os prémios, artigos de bar e experiências resgatáveis por pontos
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg self-start sm:self-auto"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            color: '#000000',
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.35)',
          }}
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar Prémio</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Rewards Grid */}
      {rewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02]">
          <Gift className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Sem Prémios</h3>
          <p className="text-gray-400 text-center max-w-sm mb-6 text-sm">
            Ainda não existem prémios criados. Começa por adicionar o primeiro prémio para os teus clientes.
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-black bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:scale-105 transition-all shadow-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Prémio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <motion.div
              key={reward.id}
              whileHover={{ scale: 1.02, y: -4 }}
              className="rounded-[2rem] overflow-hidden border border-white/10 shadow-xl flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(15, 15, 15, 0.85) 100%)',
                backdropFilter: 'blur(25px)',
              }}
            >
              {/* Image */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-black/40">
                {reward.image_path ? (
                  <img
                    src={`/api/serve-image?file=${reward.image_path}`}
                    alt={reward.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/10 to-purple-500/10">
                    <Gift className="w-16 h-16 text-[#D4AF37]/60" />
                  </div>
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(15, 15, 15, 0.95) 0%, transparent 60%)',
                  }}
                />

                {/* Points Badge */}
                <div
                  className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full font-black text-xs shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                  }}
                >
                  {reward.points} PTS
                </div>

                {/* Stock Badge */}
                <div
                  className="absolute top-4 left-4 px-3 py-1 rounded-full font-bold text-[11px] backdrop-blur-md border shadow-lg"
                  style={{
                    background: reward.stock > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    borderColor: reward.stock > 0 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                    color: reward.stock > 0 ? '#4ade80' : '#f87171',
                  }}
                >
                  {reward.stock > 0 ? `${reward.stock} em stock` : 'Esgotado'}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white mb-1.5">{reward.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{reward.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(reward)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:border-white/20 text-white"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(reward.id)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  </div>

                  {/* Availability Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs font-bold text-gray-400">Ativo para Resgate</span>
                    <button
                      onClick={() => toggleAvailability(reward.id)}
                      className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
                      style={{
                        background: reward.available
                          ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <motion.div
                        className="absolute top-1 w-4 h-4 rounded-full bg-black shadow-md"
                        animate={{
                          left: reward.available ? '28px' : '4px',
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(15px)',
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg p-6 sm:p-8 rounded-[2rem] border border-[#D4AF37]/30 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{
                background: 'rgba(15, 15, 15, 0.95)',
                backdropFilter: 'blur(30px)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {editingReward ? 'Editar Prémio' : 'Adicionar Novo Prémio'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Foto do Prémio</label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="h-44 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden bg-white/[0.03] border-2 border-dashed border-white/20 hover:border-[#D4AF37]/50"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-300 font-medium">Clica para carregar imagem</p>
                        <p className="text-[10px] text-gray-500 mt-1">PNG, JPG até 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome do Artigo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Garrafa VIP Moët & Chandon"
                    required
                    className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Points Value */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Custo em Pontos *</label>
                    <input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      placeholder="500"
                      required
                      min="1"
                      className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stock Inicial *</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="50"
                      required
                      min="0"
                      className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descrição do Prémio</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Condições e descrição do prémio..."
                    className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#D4AF37] focus:outline-none resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>A guardar...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>{editingReward ? 'Atualizar Prémio' : 'Criar Prémio'}</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(15px)',
            }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm p-6 rounded-[2rem] text-center border border-red-500/30 shadow-2xl"
              style={{
                background: 'rgba(15, 15, 15, 0.95)',
                backdropFilter: 'blur(30px)',
              }}
            >
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-xl font-black text-white mb-1">Remover Prémio?</h3>
              <p className="text-gray-400 text-xs mb-5">Esta ação não pode ser revertida.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-xs bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg"
                >
                  Remover
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
