import { useState, useEffect, useRef } from 'react';
import { Gift, Plus, X, Upload, Package, Edit, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../../../services/api';

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
      formData.append('image', imageFile);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Prémios para Clientes</h1>
          <p className="text-gray-400">Gerir itens do programa de fidelidade</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            color: '#000000',
            boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
          }}
        >
          <Plus className="w-5 h-5" />
          Adicionar Prémio
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Rewards Grid */}
      {rewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-white/10 bg-white/5">
          <Gift className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Sem Prémios</h3>
          <p className="text-gray-400 text-center max-w-sm mb-6">
            Ainda não existem prémios criados. Começa por adicionar o primeiro prémio para os teus clientes.
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              color: '#000000',
            }}
          >
            <Plus className="w-5 h-5" />
            Adicionar Prémio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <motion.div
              key={reward.id}
              whileHover={{ scale: 1.03, y: -5 }}
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                {reward.image_path ? (
                  <img
                    src={`/api/serve-image?file=${reward.image_path}`}
                    alt={reward.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20">
                    <Gift className="w-16 h-16 text-[#D4AF37]" />
                  </div>
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(10, 10, 10, 0.9) 0%, transparent 60%)',
                  }}
                ></div>

                {/* Points Badge */}
                <div
                  className="absolute top-4 right-4 px-3 py-2 rounded-xl font-black text-sm"
                  style={{
                    background: 'rgba(212, 175, 55, 0.9)',
                    color: '#000000',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {reward.points} pts
                </div>

                {/* Stock Badge */}
                <div
                  className="absolute top-4 left-4 px-3 py-2 rounded-xl font-semibold text-xs"
                  style={{
                    background: reward.stock > 0 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    color: '#ffffff',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {reward.stock > 0 ? `${reward.stock} em stock` : 'Esgotado'}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white mb-2">{reward.name}</h3>
                  <p className="text-sm text-gray-400">{reward.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(reward)}
                    className="flex-1 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(212, 175, 55, 0.2)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      color: '#D4AF37'
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(reward.id)}
                    className="flex-1 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444'
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-sm font-semibold text-gray-400">Disponível</span>
                  <button
                    onClick={() => toggleAvailability(reward.id)}
                    className="relative w-14 h-7 rounded-full transition-all duration-300"
                    style={{
                      background: reward.available
                        ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <motion.div
                      className="absolute top-1 w-5 h-5 rounded-full"
                      style={{
                        background: '#ffffff',
                      }}
                      animate={{
                        left: reward.available ? '32px' : '4px',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
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
              backdropFilter: 'blur(10px)',
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg p-8 rounded-3xl max-h-[90vh] overflow-y-auto"
              style={{
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">
                  {editingReward ? 'Editar Prémio' : 'Adicionar Novo Prémio'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Imagem</label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="h-48 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden"
                    style={{
                      background: imagePreview ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                      border: '2px dashed rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-400">Clique para carregar imagem</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Nome do Item *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Bilhete de Bebida Premium"
                    required
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Points Value */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Valor em Pontos *</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="500"
                    required
                    min="1"
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Stock *</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="100"
                    required
                    min="0"
                    className="w-full p-3 rounded-xl outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Descrição</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição do prémio..."
                    className="w-full p-3 rounded-xl outline-none resize-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      {editingReward ? 'Atualizar Prémio' : 'Adicionar Prémio'}
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
              backdropFilter: 'blur(10px)',
            }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-8 rounded-3xl text-center"
              style={{
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white mb-2">Remover Prémio?</h3>
              <p className="text-gray-400 mb-6">Esta ação não pode ser revertida.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 rounded-xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff'
                  }}
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
