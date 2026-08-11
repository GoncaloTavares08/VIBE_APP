import { motion } from 'motion/react';
import { QrCode, TrendingUp, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Guestlist Digital',
    description: 'Adeus filas. O teu convite está sempre à mão, validado num segundo à porta do clube.',
    gradient: 'from-[#D4AF37] to-[#FFD700]',
    delay: 0.1
  },
  {
    icon: TrendingUp,
    title: 'Pontos & Rewards',
    description: 'Cada saída à noite vale pontos. Sobe de nível e desbloqueia acessos VIP exclusivos.',
    gradient: 'from-[#FFD700] to-[#ffffff]',
    delay: 0.3
  },
  {
    icon: ShieldCheck,
    title: 'Acesso Exclusivo',
    description: 'Conecta-te com os melhores promotores de Portugal para acesso às listas mais restritas.',
    gradient: 'from-[#ffffff] to-[#D4AF37]',
    delay: 0.5
  },
];

export function FeaturesGrid() {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 py-16 md:py-32 z-10">
      
      <div className="text-center mb-16 md:mb-24">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight"
        >
          O Padrão <span className="text-[#D4AF37]">Premium.</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto text-lg"
        >
          Não é apenas uma app de noite. É a tua chave para os melhores espaços do país.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: feature.delay, ease: "easeOut" }}
              whileHover={{ y: -10 }}
              className="group relative p-1 rounded-3xl"
            >
              {/* Animated gradient border */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-500`}
              ></div>
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-500`}
              ></div>

              <div className="relative h-full p-8 rounded-[1.4rem] bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 flex flex-col items-start overflow-hidden">
                
                {/* Background glow orb */}
                <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity duration-500`}></div>

                {/* Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#D4AF37]/10 transition-all duration-300 shadow-xl">
                  <Icon className="w-7 h-7 text-[#D4AF37]" strokeWidth={2} />
                </div>

                {/* Content */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}