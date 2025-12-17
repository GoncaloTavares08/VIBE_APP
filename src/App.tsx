import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FeaturesGrid } from './components/FeaturesGrid';

import { InteractiveBackground } from './components/InteractiveBackground';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Ambient glow effects in background */}
      <InteractiveBackground />

      <div className="relative z-10">
        <Header />
        <HeroSection />
        <FeaturesGrid />
      </div>
    </div>
  );
}