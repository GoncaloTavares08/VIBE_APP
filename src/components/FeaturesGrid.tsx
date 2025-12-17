import { QrCode, TrendingUp, Scan } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Entrada Rápida',
    description: 'Adeus filas. O teu bilhete está na tua carteira digital.',
    gradient: 'from-[#ffffff] to-[#888888]',
  },
  {
    icon: TrendingUp,
    title: 'Comissões Reais',
    description: 'Vê quem entrou com o teu link em tempo real.',
    gradient: 'from-[#888888] to-[#ffffff]',
  },
  {
    icon: Scan,
    title: 'Controlo Total',
    description: 'Validação instantânea à porta.',
    gradient: 'from-[#cccccc] to-[#888888]',
  },
];

export function FeaturesGrid() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="group relative p-8 rounded-3xl transition-all duration-300 hover:scale-105 hover:-translate-y-2"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Glow effect on hover */}
              <div 
                className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-3xl blur-xl bg-gradient-to-br ${feature.gradient}`}
              ></div>
              
              {/* Gold accent border on hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                style={{
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              ></div>

              <div className="relative z-10 space-y-4">
                {/* Icon with gradient background */}
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: '#000000',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)',
                  }}
                >
                  <Icon className="w-7 h-7 text-[#D4AF37]" strokeWidth={2.5} />
                </div>

                {/* Title */}
                <h3 
                  className="text-2xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #888888 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Corner accent */}
              <div 
                className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-3xl blur-2xl`}
              ></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}