import { LogOut, Settings, Bell } from 'lucide-react';

interface ClientHeaderProps {
  userName?: string;
  onLogout?: () => void;
}

export function ClientHeader({ userName = 'André Silva', onLogout }: ClientHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(30px)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
        {/* Left: Welcome Message */}
        <div>
          <h1
            className="text-2xl font-black"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome back, {userName.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400">Ready for tonight?</p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Bell className="w-5 h-5 text-gray-400" />
            {/* Notification Badge */}
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#000',
              }}
            >
              3
            </div>
          </button>

          {/* Settings */}
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm hidden md:inline">Exit</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
