import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Lock, User, MessageSquare, ArrowLeft, Search, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { PrivateMessage, UserProfile } from '../types';

interface PrivateChatModalProps {
  currentUser: UserProfile;
  partnerUsername: string | null;
  partnerDisplayName?: string;
  partnerBadge?: string;
  messages: PrivateMessage[];
  allConversations: string[]; // usernames of users we have chats with
  availableMembers: Array<{ username: string; displayName?: string; badge?: string }>;
  onSendMessage: (recipientUsername: string, content: string) => void;
  onSelectPartner: (username: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onClose: () => void;
}

export const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  currentUser,
  partnerUsername,
  partnerDisplayName,
  partnerBadge,
  messages,
  allConversations,
  availableMembers,
  onSendMessage,
  onSelectPartner,
  onDeleteMessage,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [inChatSearch, setInChatSearch] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const cleanPartner = (partnerUsername || '').trim().toLowerCase().replace(/^@/, '');
  const isPartnerKnown = Boolean(
    cleanPartner &&
      cleanPartner !== 'anonymous' &&
      cleanPartner !== 'guest' &&
      (cleanPartner === 'muhammedrafii2002' ||
        cleanPartner === currentUser.username.toLowerCase() ||
        availableMembers.some((m) => m.username.toLowerCase() === cleanPartner))
  );

  // Filter messages for current partner
  const activeConversationMessages = partnerUsername
    ? messages.filter(
        (m) =>
          (m.senderUsername.toLowerCase() === currentUser.username.toLowerCase() &&
            m.recipientUsername.toLowerCase() === cleanPartner) ||
          (m.senderUsername.toLowerCase() === cleanPartner &&
            m.recipientUsername.toLowerCase() === currentUser.username.toLowerCase())
      )
    : [];

  const displayedChatMessages = partnerUsername && inChatSearch.trim()
    ? activeConversationMessages.filter((m) =>
        m.content.toLowerCase().includes(inChatSearch.trim().toLowerCase())
      )
    : activeConversationMessages;

  useEffect(() => {
    if (partnerUsername) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversationMessages.length, partnerUsername]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !partnerUsername || !isPartnerKnown) return;

    onSendMessage(cleanPartner, inputText.trim());
    setInputText('');
  };

  const filteredConversations = allConversations.filter((username) => {
    const clean = (username || '').toLowerCase();
    if (clean === 'anonymous' || clean === 'guest') return false;
    if (!searchFilter.trim()) return true;
    const term = searchFilter.trim().toLowerCase();
    const userMatches = clean.includes(term);
    const userMsgs = messages.filter(
      (m) =>
        (m.senderUsername.toLowerCase() === currentUser.username.toLowerCase() && m.recipientUsername.toLowerCase() === clean) ||
        (m.senderUsername.toLowerCase() === clean && m.recipientUsername.toLowerCase() === currentUser.username.toLowerCase())
    );
    const msgMatches = userMsgs.some((m) => m.content.toLowerCase().includes(term));
    return userMatches || msgMatches;
  });

  const filteredMembers = availableMembers.filter(
    (m) =>
      m.username.toLowerCase() !== currentUser.username.toLowerCase() &&
      m.username.toLowerCase() !== 'anonymous' &&
      m.username.toLowerCase() !== 'guest' &&
      (m.username.toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
        (m.displayName && m.displayName.toLowerCase().includes(searchFilter.trim().toLowerCase())))
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-100 my-auto">
        
        {/* HEADER */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {partnerUsername && (
              <button
                onClick={() => onSelectPartner('')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Back to conversation list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                {partnerUsername ? (cleanPartner === 'muhammedrafii2002' ? '👨‍💻' : partnerUsername.slice(0, 2).toUpperCase()) : '💬'}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-1.5">
                  {partnerUsername ? (
                    <>
                      <span>{cleanPartner === 'muhammedrafii2002' ? 'Developer (@developer)' : `@${partnerUsername}`}</span>
                      {partnerBadge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {partnerBadge}
                        </span>
                      )}
                    </>
                  ) : (
                    <span>Direct Private Chats (1-on-1)</span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Private & Encrypted Student Chat</span>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN BODY: VIEW CONVERSATIONS LIST OR CHAT FEED */}
        {!partnerUsername ? (
          /* CONVERSATIONS & MEMBER SELECTOR */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60">
            {/* PINNED LEAD DEVELOPER CARD */}
            {currentUser.username !== 'muhammedrafii2002' && (() => {
              const devUnreadCount = messages.filter(
                (m) => m.senderUsername === 'muhammedrafii2002' && m.recipientUsername === currentUser.username && !m.isRead
              ).length;

              return (
                <div className="bg-gradient-to-r from-orange-950/90 via-amber-950/60 to-slate-900 border-2 border-orange-500/60 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black flex items-center justify-center text-base shadow-md shadow-orange-500/30 shrink-0">
                        👨‍💻
                      </div>
                      {devUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-white">
                          Developer
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-500/30 text-orange-200 border border-orange-400/50 flex items-center gap-1">
                          📌 Lead Developer
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Contact for Support.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {devUnreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-full shadow-xs">
                        {devUnreadCount}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectPartner('muhammedrafii2002')}
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-md transition shrink-0 flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask Doubts</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Search Member & Chat Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search by username or message content..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3 top-2.5 p-1 text-slate-500 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active Conversations */}
            {filteredConversations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Recent Direct Conversations ({filteredConversations.length})</span>
                  {searchFilter && <span className="text-[10px] text-orange-400">Filtered</span>}
                </h4>
                <div className="space-y-2">
                  {filteredConversations.map((username) => {
                    const isDev = username.toLowerCase() === 'muhammedrafii2002';
                    const memberInfo = availableMembers.find((m) => m.username === username);
                    const userMsgs = messages.filter(
                      (m) =>
                        (m.senderUsername === currentUser.username && m.recipientUsername === username) ||
                        (m.senderUsername === username && m.recipientUsername === currentUser.username)
                    );
                    const lastMsg = userMsgs[userMsgs.length - 1];
                    const unreadCount = messages.filter(
                      (m) => m.senderUsername === username && m.recipientUsername === currentUser.username && !m.isRead
                    ).length;

                    return (
                      <button
                        key={username}
                        onClick={() => onSelectPartner(username)}
                        className="w-full p-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-xs border shrink-0 ${
                              isDev
                                ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white border-orange-400/40'
                                : 'bg-slate-800 text-orange-400 border-slate-700'
                            }`}>
                              {isDev ? '👨‍💻' : username.slice(0, 2).toUpperCase()}
                            </div>
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-white group-hover:text-orange-400 transition truncate">
                                {isDev ? 'Developer' : `@${username}`}
                              </span>
                              {isDev ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 shrink-0">
                                  ⚡ Lead Dev
                                </span>
                              ) : memberInfo?.badge ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                  {memberInfo.badge}
                                </span>
                              ) : null}
                            </div>
                            <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                              {lastMsg ? lastMsg.content : 'Tap to open private chat...'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[11px] rounded-full min-w-5 text-center shadow-xs">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Room Members */}
            {filteredMembers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  All Campus Members ({filteredMembers.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredMembers.map((member) => {
                    const isDev = member.username.toLowerCase() === 'muhammedrafii2002';
                    const memberUnreadCount = messages.filter(
                      (m) => m.senderUsername === member.username && m.recipientUsername === currentUser.username && !m.isRead
                    ).length;

                    return (
                      <button
                        key={member.username}
                        onClick={() => onSelectPartner(member.username)}
                        className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 rounded-2xl transition flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs border shrink-0 ${
                              isDev
                                ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white border-orange-400/40'
                                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                              {isDev ? '👨‍💻' : member.username.slice(0, 2).toUpperCase()}
                            </div>
                            {memberUnreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-200 group-hover:text-orange-400 transition truncate flex items-center gap-1">
                              <span>{isDev ? 'Developer' : `@${member.username}`}</span>
                              {isDev && (
                                <span className="text-[8px] font-black px-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                  Lead Dev
                                </span>
                              )}
                            </div>
                            {member.displayName && (
                              <div className="text-[10px] text-slate-400 truncate">
                                {member.displayName}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          {memberUnreadCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full">
                              {memberUnreadCount}
                            </span>
                          )}
                          <span className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-orange-600 text-slate-300 group-hover:text-white transition text-xs">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredConversations.length === 0 && filteredMembers.length === 0 && (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">No conversations or members found matching "{searchFilter}"</p>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE 1-ON-1 CHAT MESSAGES FEED */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* In-chat search bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={inChatSearch}
                onChange={(e) => setInChatSearch(e.target.value)}
                placeholder={`Search messages in chat with @${partnerUsername}...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              {inChatSearch && (
                <button
                  onClick={() => setInChatSearch('')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/80">
              {isPartnerKnown ? (
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 text-center text-xs text-slate-400 max-w-sm mx-auto my-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span>You are chatting privately with <strong className="text-white">{cleanPartner === 'muhammedrafii2002' ? 'Developer' : `@${partnerUsername}`}</strong>. Messages are private to you both.</span>
                </div>
              ) : (
                <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-center text-xs text-rose-300 max-w-md mx-auto my-2 space-y-1">
                  <ShieldAlert className="w-5 h-5 text-rose-400 mx-auto" />
                  <p className="font-bold text-rose-200">User @{partnerUsername} does not exist</p>
                  <p className="text-[11px] text-rose-300/80">
                    This username is not registered on the campus network. Sending messages to non-existent accounts is disabled.
                  </p>
                </div>
              )}

              {displayedChatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-xl">
                    {inChatSearch ? '🔍' : '👋'}
                  </div>
                  <p className="text-xs">
                    {inChatSearch
                      ? `No chat messages matched "${inChatSearch}"`
                      : isPartnerKnown
                      ? `No private messages yet. Say hi to ${cleanPartner === 'muhammedrafii2002' ? 'Developer' : `@${partnerUsername}`}!`
                      : `No conversation found.`}
                  </p>
                </div>
              ) : (
                displayedChatMessages.map((msg) => {
                  const isMe = msg.senderUsername.toLowerCase() === currentUser.username.toLowerCase();
                  const isDevSender = msg.senderUsername.toLowerCase() === 'muhammedrafii2002';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`group relative max-w-xs sm:max-w-md rounded-2xl p-3 border text-xs sm:text-sm ${
                          isMe
                            ? 'bg-orange-600 text-white border-orange-500 rounded-br-none'
                            : 'bg-slate-800 text-slate-100 border-slate-700 rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1 border-b border-white/10 pb-1">
                          <span className={`font-bold text-[10px] ${isMe ? 'text-orange-100' : 'text-orange-400'}`}>
                            {isMe ? 'You' : isDevSender ? 'Developer ⚡' : `@${msg.senderUsername}`}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-mono ${
                                isMe ? 'text-orange-200' : 'text-slate-400'
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {(isMe || currentUser.isAdmin) && onDeleteMessage && (
                              <button
                                onClick={() => onDeleteMessage(msg.id)}
                                className="p-1 hover:bg-black/20 rounded transition text-red-200 hover:text-red-400 cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="w-3 h-3 text-red-300 hover:text-red-100" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="leading-relaxed mt-1">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* INPUT BOX */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                disabled={!isPartnerKnown}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isPartnerKnown
                    ? `Message @${partnerUsername} privately...`
                    : `Cannot message non-existent user @${partnerUsername}`
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || !isPartnerKnown}
                className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
