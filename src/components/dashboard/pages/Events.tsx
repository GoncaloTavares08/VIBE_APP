import { Calendar } from 'lucide-react';

export function Events() {
  return (
    <div className="space-y-8">
      <div className="text-center py-20">
        <div
          className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6"
          style={{
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <Calendar className="w-12 h-12 text-[#D4AF37]" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4">Página de Eventos</h2>
        <p className="text-gray-400">Em breve...</p>
      </div>
    </div>
  );
}
