import { motion, AnimatePresence } from 'motion/react';
import {
    UserPlus,
    DollarSign,
    Calendar,
    Users,
    AlertCircle,
    Check,
    X,
    Flame
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { PersonProfileModal } from './client/PersonProfileModal';

interface Notification {
    id: string;
    type: 'registration' | 'payment' | 'event' | 'team' | 'system' | 'match';
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
    avatar?: string;
    data?: any;
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadCountChange?: (count: number) => void;
}



const notificationIcons = {
    registration: UserPlus,
    payment: DollarSign,
    event: Calendar,
    team: Users,
    system: AlertCircle,
    match: Flame,
};

const notificationColors = {
    registration: '#4F46E5', // Purple
    payment: '#10B981', // Green
    event: '#D4AF37', // Gold
    team: '#3B82F6', // Blue
    system: '#EF4444', // Red
    match: '#FF4500', // Orange Red
};

export function NotificationPanel({ isOpen, onClose, onUnreadCountChange }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<any>(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const data = await apiFetch('/notifications');
            if (data.status === 'success') {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    // Smart Polling
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
        // Poll every 30 seconds for real-time updates
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isOpen]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        if (onUnreadCountChange) {
            onUnreadCountChange(unreadCount);
        }
    }, [unreadCount, onUnreadCountChange]);

    const handleMarkAllRead = async () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        try {
            await apiFetch('/notifications/mark-all-read', {
                method: 'POST'
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
        try {
            await apiFetch(`/notifications/${id}/mark-read`, {
                method: 'POST'
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }

        if (notification.type === 'match' && notification.data?.matched_user_id) {
            try {
                const response = await apiFetch('/networking/matches');
                if (response.status === 'success' && response.matches) {
                    const person = response.matches.find((m: any) => m.id === notification.data.matched_user_id);
                    if (person) {
                        setSelectedPerson(person);
                    }
                }
            } catch (err) {
                console.error('Error fetching match profile:', err);
            }
        }
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
                                        // Use system icon as fallback for unknown types
                                        const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || AlertCircle;
                                        const iconColor = notificationColors[notification.type as keyof typeof notificationColors] || '#EF4444';

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
                                                onClick={() => handleNotificationClick(notification)}
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
                    
                    {/* Render Person Profile Modal if a match is clicked */}
                    {selectedPerson && (
                        <PersonProfileModal
                            person={selectedPerson}
                            isMatch={true}
                            onClose={() => setSelectedPerson(null)}
                        />
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
