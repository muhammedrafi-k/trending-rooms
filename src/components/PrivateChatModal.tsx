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
  isTabEmbed?: boolean;
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
  isTabEmbed = false,
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
      (cleanPartner === currentUser.username.toLowerCase() ||
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

  const innerContent = (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl w-full flex flex-col overflow-hidden shadow-2xl text-slate-100 ${
      isTabEmbed ? 'h-full flex-1' : 'max-w-2xl max-h-[85vh] sm:max-h-[90vh] h-[85vh] my-auto'
    }`}>
      
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {partnerUsername && (
            <button
              onClick={() => onSelectPartner('')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Back to conversation list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
              {partnerUsername ? partnerUsername.slice(0, 2).toUpperCase() : '💬'}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-1.5">
                {partnerUsername ? (
                  <>
                    <span>@{partnerUsername}</span>
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
                <span>Private & Direct User Chat</span>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          title="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* MAIN BODY */}
      {!partnerUsername ? (
        /* CONVERSATIONS & MEMBER SELECTOR */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60">
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
                      className="w-full p-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {username.slice(0, 2).toUpperCase()}
                          </div>
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-white truncate">
                              @{username}
                            </span>
                            {memberInfo?.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-orange-300 border border-slate-700">
                                {memberInfo.badge}
                              </span>
                            )}
                          </div>
                          {lastMsg && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              <span className="font-medium text-slate-500">
                                {lastMsg.senderUsername === currentUser.username ? 'You: ' : ''}
                              </span>
                              {lastMsg.content}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-orange-600 text-white font-bold text-xs rounded-full">
                            {unreadCount}
                          </span>
                        )}
                        <span className="text-slate-600 group-hover:text-slate-400 text-xs">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Members list */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Start Chat with Campus Members ({filteredMembers.length})
            </h4>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-4">
                {searchFilter
                  ? `No members found matching "${searchFilter}"`
                  : 'No other campus members online right now. Invite friends to start chatting!'}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredMembers.map((member) => (
                  <button
                    key={member.username}
                    onClick={() => onSelectPartner(member.username)}
                    className="w-full p-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl transition flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700 uppercase shrink-0">
                        {member.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">
                          @{member.username}
                        </div>
                        {member.displayName && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {member.displayName}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1 hover:underline">
                      <MessageSquare className="w-3 h-3" />
                      <span>Message</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ACTIVE CHAT FEED */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/80">
          {/* In-chat search bar */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center gap-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-500" />
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
                <span>You are chatting privately with <strong className="text-white">@{partnerUsername}</strong>. Messages are private to you both.</span>
              </div>
            ) : (
              <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-center text-xs text-rose-300 max-w-md mx-auto my-2 space-y-1">
                <ShieldAlert className="w-5 h-5 text-rose-400 mx-auto" />
                <p className="font-bold text-rose-200">User @{partnerUsername} does not exist</p>
                <p className="text-[11px] text-rose-300/80">
                  This username is not registered. Sending messages to non-existent accounts is disabled.
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
                    ? `No private messages yet. Say hi to @${partnerUsername}!`
                    : `No conversation found.`}
                </p>
              </div>
            ) : (
              displayedChatMessages.map((msg) => {
                const isMe = msg.senderUsername.toLowerCase() === currentUser.username.toLowerCase();
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
                        <span className="font-bold text-[10px] opacity-80">
                          {isMe ? 'You' : `@${msg.senderUsername}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] opacity-60">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {onDeleteMessage && (
                            <button
                              onClick={() => onDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-300 transition p-0.5 rounded cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT BAR */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isPartnerKnown
                  ? `Message @${partnerUsername}...`
                  : `Cannot send message to non-existent user`
              }
              disabled={!isPartnerKnown}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !isPartnerKnown}
              className="p-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );

  if (isTabEmbed) {
    return innerContent;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {innerContent}
    </div>
  );
};
