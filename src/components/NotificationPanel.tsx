import { motion, AnimatePresence } from 'motion/react';
import {
    UserPlus,
    DollarSign,
    Calendar,
    Users,
    AlertCircle,
    Check,
    X
} from 'lucide-react';
import { useState } from 'react';

interface Notification {
    id: string;
    type: 'registration' | 'payment' | 'event' | 'team' | 'system';
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
    avatar?: string;
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const mockNotifications: Notification[] = [
    {
        id: '1',
        type: 'registration',
        title: 'New Customer Registration',
        description: 'Maria Santos just joined VIBE',
        timestamp: '5 min ago',
        isRead: false,
        avatar: '👤',
    },
    {
        id: '2',
        type: 'payment',
        title: 'Payment Received',
        description: '€150 from VIP Table booking',
        timestamp: '2 hours ago',
        isRead: false,
    },
    {
        id: '3',
        type: 'event',
        title: 'Event Reminder',
        description: 'Saturday Night Live starts in 4 hours',
        timestamp: '3 hours ago',
        isRead: false,
    },
    {
        id: '4',
        type: 'team',
        title: 'Team Activity',
        description: 'João added 15 guests to the list',
        timestamp: '5 hours ago',
        isRead: true,
    },
    {
        id: '5',
        type: 'system',
        title: 'System Alert',
        description: 'Capacity at 85% - Consider guest list limits',
        timestamp: '1 day ago',
        isRead: true,
    },
];

const notificationIcons = {
    registration: UserPlus,
    payment: DollarSign,
    event: Calendar,
    team: Users,
    system: AlertCircle,
};

const notificationColors = {
    registration: '#4F46E5', // Purple
    payment: '#10B981', // Green
    event: '#D4AF37', // Gold
    team: '#3B82F6', // Blue
    system: '#EF4444', // Red
};

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState(mockNotifications);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const handleMarkAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed right-4 top-20 z-50 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden"
                        style={{
                            background: 'rgba(0, 0, 0, 0.95)',
                            backdropFilter: 'blur(30px)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.1)',
                        }}
                    >
                        {/* Header */}
                        <div
                            className="px-6 py-4 border-b flex items-center justify-between"
                            style={{
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                background: 'rgba(255, 255, 255, 0.02)',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <h3
                                    className="text-lg font-black"
                                    style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Notificações
                                </h3>
                                {unreadCount > 0 && (
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs font-black"
                                        style={{
                                            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                            color: '#000',
                                        }}
                                    >
                                        {unreadCount}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                                        style={{
                                            background: 'rgba(212, 175, 55, 0.1)',
                                            border: '1px solid rgba(212, 175, 55, 0.3)',
                                            color: '#D4AF37',
                                        }}
                                    >
                                        <Check className="w-3 h-3" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div
                            className="max-h-[500px] overflow-y-auto"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(212, 175, 55, 0.3) transparent',
                            }}
                        >
                            {notifications.length === 0 ? (
                                /* Empty State */
                                <div className="px-6 py-12 text-center">
                                    <div
                                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                    >
                                        <Check className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <h4 className="text-white mb-1">All caught up!</h4>
                                    <p className="text-sm text-gray-400">No new notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                                    {notifications.map((notification) => {
                                        const Icon = notificationIcons[notification.type];
                                        const iconColor = notificationColors[notification.type];

                                        return (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="px-6 py-4 cursor-pointer transition-all duration-200 relative group"
                                                style={{
                                                    background: notification.isRead
                                                        ? 'transparent'
                                                        : 'rgba(212, 175, 55, 0.03)',
                                                }}
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                whileHover={{
                                                    background: 'rgba(212, 175, 55, 0.08)',
                                                }}
                                            >
                                                {/* Unread Indicator */}
                                                {!notification.isRead && (
                                                    <div
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                                        style={{
                                                            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                                            boxShadow: '0 0 8px rgba(212, 175, 55, 0.6)',
                                                        }}
                                                    />
                                                )}

                                                <div className="flex gap-4">
                                                    {/* Icon/Avatar */}
                                                    <div
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                                                        style={{
                                                            background: `${iconColor}15`,
                                                            border: `1px solid ${iconColor}30`,
                                                        }}
                                                    >
                                                        {notification.avatar ? (
                                                            <span className="text-lg">{notification.avatar}</span>
                                                        ) : (
                                                            <Icon className="w-5 h-5" style={{ color: iconColor }} />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h4
                                                                className={`text-sm ${notification.isRead ? 'text-gray-300' : 'text-white'}`}
                                                                style={{ fontWeight: notification.isRead ? 400 : 600 }}
                                                            >
                                                                {notification.title}
                                                            </h4>
                                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                                                {notification.timestamp}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-400 line-clamp-2">
                                                            {notification.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Hover Glow Effect */}
                                                <div
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                                                    style={{
                                                        background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.05), transparent)',
                                                    }}
                                                />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div
                                className="px-6 py-3 border-t text-center"
                                style={{
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                }}
                            >
                                <button
                                    className="text-sm transition-colors duration-200"
                                    style={{ color: '#D4AF37' }}
                                    onClick={onClose}
                                >
                                    View All Notifications
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
