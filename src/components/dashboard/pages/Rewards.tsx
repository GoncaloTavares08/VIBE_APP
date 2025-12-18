import { useState } from 'react';
import { Gift, Plus, X, Upload, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Reward {
  id: number;
  name: string;
  points: number;
  stock: number;
  available: boolean;
  image: string;
  description: string;
}

const mockRewards: Reward[] = [
  { id: 1, name: 'Entrada Grátis', points: 500, stock: 50, available: true, image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400', description: 'Evite a fila e entre grátis' },
  { id: 2, name: 'Bebida de Oferta', points: 250, stock: 120, available: true, image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400', description: 'Uma bebida de oferta' },
  { id: 3, name: 'Mesa VIP', points: 2000, stock: 5, available: true, image: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400', description: 'Mesa VIP reservada para 4' },
  { id: 4, name: 'Serviço de Garrafa', points: 1500, stock: 8, available: true, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400', description: 'Serviço de garrafa premium' },
  { id: 5, name: 'Convidado +1', points: 300, stock: 100, available: true, image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400', description: 'Traga um amigo grátis' },
  { id: 6, name: 'Entrada Expresso', points: 200, stock: 0, available: false, image: 'https://images.unsplash.com/photo-1485872299829-c673f5194813?w=400', description: 'Entrada rápida' },
];

export function Rewards() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [rewards, setRewards] = useState(mockRewards);

  const toggleAvailability = (id: number) => {
    setRewards(rewards.map(reward =>
      reward.id === id ? { ...reward, available: !reward.available } : reward
    ));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Prémios para Clientes</h1>
          <p className="text-gray-400">Gerir itens do programa de fidelidade</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
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

      {/* Rewards Grid */}
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
              <img
                src={reward.image}
                alt={reward.name}
                className="w-full h-full object-cover"
              />
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
            <div className="p-5">
              <h3 className="text-xl font-black text-white mb-2">{reward.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{reward.description}</p>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between">
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

      {/* Add Reward Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
            }}
            onClick={() => setShowAddModal(false)}
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
                <h3 className="text-2xl font-black text-white">Adicionar Novo Prémio</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <form className="space-y-5">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Imagem</label>
                  <div
                    className="h-48 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px dashed rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-400">Clique para carregar imagem</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                  </div>
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Nome do Item</label>
                  <input
                    type="text"
                    placeholder="ex: Bilhete de Bebida Premium"
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
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Valor em Pontos</label>
                  <input
                    type="number"
                    placeholder="500"
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
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Stock Inicial</label>
                  <input
                    type="number"
                    placeholder="100"
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
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    color: '#000000',
                  }}
                >
                  <Package className="w-5 h-5" />
                  Adicionar Prémio
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
