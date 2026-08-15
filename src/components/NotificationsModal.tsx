import React, { useState } from 'react';
import { AppNotification } from '../types';
import { Bell, CheckCircle2, MessageSquare, AlertTriangle, Shield, Trash2, X, ExternalLink, Volume2 } from 'lucide-react';

interface NotificationsModalProps {
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
  onRequestBrowserPermission: () => void;
  notificationPermissionStatus: NotificationPermission | 'unsupported';
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  onRequestBrowserPermission,
  notificationPermissionStatus,
  onClose,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'mention':
        return <span className="text-orange-400 font-bold">@</span>;
      case 'dm':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'room_admin':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'admin_alert':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-100 my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <span>Notifications & Mentions</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Mentions, Direct Chats, and Admin Alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OUTSIDE BROWSER PUSH NOTIFICATION BANNER */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Outside System Notifications</p>
              <p className="text-[11px] text-slate-400">
                {notificationPermissionStatus === 'granted'
                  ? '✅ Active: You will receive browser push notifications even when away.'
                  : 'Get notified outside the browser when tagged in rooms or DM\'d.'}
              </p>
            </div>
          </div>

          {notificationPermissionStatus !== 'granted' && (
            <button
              onClick={onRequestBrowserPermission}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition shrink-0 whitespace-nowrap"
            >
              Enable Outside Push
            </button>
          )}
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/60">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Bell className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
              <p className="text-xs">No notifications yet. You'll be alerted when mentioned or messaged!</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onSelectNotification?.(notif)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  notif.isRead
                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                    : 'bg-slate-800/90 border-orange-500/40 text-white shadow-md'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-white truncate">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="text-xs text-orange-400 font-bold hover:underline disabled:opacity-40"
          >
            Mark all as read
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
