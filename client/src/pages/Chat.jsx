import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MoreVertical, Search, ArrowLeft, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api, { emergencyService } from '../services/api';

const Chat = () => {
  const { user, socket } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Inbox & Chat Lists
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Message Sending
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);

  // Typing Indicators
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);

  // Emergency States & Actions
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [ownEmergencies, setOwnEmergencies] = useState([]);
  const [emergencyForm, setEmergencyForm] = useState({ bloodType: 'O+', patientInfo: '' });
  const [emergencyError, setEmergencyError] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  const loadOwnEmergencies = async () => {
    if (user?.role === 'hospital') {
      try {
        const res = await emergencyService.getOwnChatEmergencies();
        setOwnEmergencies(res.data);
      } catch (err) {
        console.error('Failed to load own emergencies:', err);
      }
    }
  };

  const handleFulfillEmergency = async (reqId) => {
    if (!window.confirm('Mark this emergency request as fulfilled? This will broadcast the resolution message to all recipients.')) return;
    try {
      await emergencyService.fulfillChatEmergency(reqId);
      loadOwnEmergencies();
      if (activeChat) {
        handleSelectChat(activeChat);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fulfill request');
    }
  };

  const handleRaiseEmergencySubmit = async (e) => {
    e.preventDefault();
    setEmergencyError('');
    setEmergencyLoading(true);
    try {
      await emergencyService.createChatEmergency({
        blood_type_needed: emergencyForm.bloodType,
        patient_info: emergencyForm.patientInfo
      });
      setShowEmergencyModal(false);
      setEmergencyForm({ bloodType: 'O+', patientInfo: '' });
      loadOwnEmergencies();
      loadInbox();
      if (activeChat) {
        handleSelectChat(activeChat);
      }
    } catch (err) {
      setEmergencyError(err.response?.data?.message || 'Failed to broadcast request');
    } finally {
      setEmergencyLoading(false);
    }
  };

  const loadInbox = async () => {
    try {
      const res = await api.get('/chats');
      setChats(res.data);
      
      // Check query params to open a specific chat with a user
      const targetUserId = searchParams.get('userId');
      if (targetUserId) {
        const chatRes = await api.post('/chats', { userId2: Number(targetUserId) });
        const targetChatId = chatRes.data.chatId;
        
        // Find or wait for chats list refresh
        const existingChat = res.data.find(c => c.chat_id === targetChatId);
        if (existingChat) {
          handleSelectChat(existingChat);
        } else {
          // Re-fetch inbox
          const updatedInbox = await api.get('/chats');
          setChats(updatedInbox.data);
          const newChat = updatedInbox.data.find(c => c.chat_id === targetChatId);
          if (newChat) handleSelectChat(newChat);
        }
      }
    } catch (err) {
      console.error('Failed to load chats inbox:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadInbox();
      loadOwnEmergencies();
    }
  }, [user, searchParams]);

  // Handle Socket.IO events for active chat
  useEffect(() => {
    if (socket && activeChat) {
      socket.emit('join_chat', activeChat.chat_id);
      
      socket.on('receive_message', (message) => {
        if (Number(message.chat_id) === Number(activeChat.chat_id)) {
          setMessages(prev => [...prev, message]);
          // Mark messages as read on backend
          api.post(`/chats/${activeChat.chat_id}/read`);
        }
        // Refresh inbox previews
        loadInbox();
      });

      socket.on('user_typing', ({ userId: typingUserId, isTyping: typingStatus }) => {
        if (Number(typingUserId) === Number(activeChat.other_user_id)) {
          setOtherUserTyping(typingStatus);
        }
      });

      return () => {
        socket.emit('leave_chat', activeChat.chat_id);
        socket.off('receive_message');
        socket.off('user_typing');
      };
    }
  }, [socket, activeChat]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = async (chat) => {
    setActiveChat(chat);
    setMessages([]);
    setOtherUserTyping(false);
    
    try {
      const res = await api.get(`/chats/${chat.chat_id}/messages`);
      setMessages(res.data);
      // Mark read
      await api.post(`/chats/${chat.chat_id}/read`);
      loadInbox(); // reload counts
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setSending(true);

    try {
      // Emit over Socket.IO
      if (socket) {
        socket.emit('send_message', {
          chatId: activeChat.chat_id,
          receiverId: activeChat.other_user_id,
          content: newMessageText,
          imageUrl: null
        });
      }

      setNewMessageText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
      // Emit stop typing
      if (socket) {
        socket.emit('typing', { chatId: activeChat.chat_id, isTyping: false });
      }
    }
  };

  const handleTextChange = (e) => {
    setNewMessageText(e.target.value);
    
    if (!socket || !activeChat) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { chatId: activeChat.chat_id, isTyping: true });
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { chatId: activeChat.chat_id, isTyping: false });
    }, 2000);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-8 flex flex-col h-screen overflow-hidden">
        <div className="flex-grow bg-white rounded-2xl border border-gray-100 shadow-sm flex overflow-hidden h-[calc(100vh-4rem)]">
          
          {/* Inbox Panel (List of active chats) */}
          <div className={`w-80 border-r border-gray-100 flex flex-col shrink-0 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Direct Messages</h3>
                {user?.role === 'hospital' && (
                  <button
                    onClick={() => setShowEmergencyModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow-sm"
                  >
                    🚨 Raise Emergency
                  </button>
                )}
              </div>
            </div>
            {user?.role === 'hospital' && ownEmergencies.filter(e => e.status === 'active').length > 0 && (
              <div className="p-3 bg-red-50/40 border-b border-gray-100 overflow-y-auto max-h-48 space-y-2 shrink-0">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Active Broadcasts</p>
                {ownEmergencies.filter(e => e.status === 'active').map(req => (
                  <div key={req.id} className="bg-white border border-red-100 p-2 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-gray-800">Need {req.blood_type_needed}</p>
                      {req.patient_info && <p className="text-[10px] text-gray-500 truncate max-w-[130px]">{req.patient_info}</p>}
                    </div>
                    <button
                      onClick={() => handleFulfillEmergency(req.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-[9px] px-2 py-1 rounded transition shrink-0"
                    >
                      Acquired
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex-grow overflow-y-auto p-2 space-y-1">
              {chats.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8 px-4">
                  No chat logs found. Visit profiles to send a direct message.
                </p>
              ) : (
                chats.map(chat => (
                  <div 
                    key={chat.chat_id} 
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      activeChat?.chat_id === chat.chat_id 
                        ? 'bg-red-50 text-red-600' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                      {chat.other_user_name?.slice(0, 2) || 'CC'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate text-gray-800">{chat.other_user_name}</span>
                        <span className="text-xs text-gray-400">
                          {chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500 truncate max-w-[150px]">
                          {chat.last_message_sender === user.id ? 'You: ' : ''}
                          {chat.last_message || 'Start a conversation'}
                        </span>
                        {Number(chat.last_message_read) === 0 && Number(chat.last_message_sender) !== Number(user.id) && (
                          <span className="w-2 h-2 bg-red-600 rounded-full shrink-0"></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messaging Box Panel */}
          <div className={`flex-grow flex flex-col min-w-0 ${!activeChat ? 'hidden md:flex items-center justify-center bg-gray-50' : 'flex bg-white'}`}>
            {activeChat ? (
              <>
                {/* Chat Panel Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="md:hidden text-gray-500 hover:text-red-600 mr-1" onClick={() => setActiveChat(null)}>
                      <ArrowLeft size={20} />
                    </button>
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                      {activeChat.other_user_name?.slice(0, 2) || 'CC'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 leading-tight">{activeChat.other_user_name}</h4>
                      <span className="text-xs text-gray-500 capitalize">{activeChat.other_user_role}</span>
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, i) => {
                    const isSelf = Number(msg.sender_id) === Number(user.id);
                    const isAlert = msg.type === 'emergency_alert';
                    const isResolved = msg.type === 'emergency_resolved';

                    if (isAlert || isResolved) {
                      return (
                        <div key={msg.id || i} className="w-full flex justify-center my-3">
                          <div className={`w-full max-w-md p-4 rounded-xl border-l-4 text-left shadow-sm ${
                            isAlert 
                              ? 'bg-red-50 border-red-600 text-red-800' 
                              : 'bg-green-50 border-green-600 text-green-800'
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                              <span>{isAlert ? '🚨 Emergency Blood Request' : '✅ Emergency Resolved'}</span>
                            </div>
                            <p className="text-sm mt-1.5 font-medium leading-relaxed">{msg.content}</p>
                            <span className="text-[10px] opacity-70 block mt-2">
                              {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id || i} className={`flex gap-3 max-w-[75%] ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className="space-y-1">
                          <div className={`p-3 rounded-2xl text-sm ${
                            isSelf 
                              ? 'bg-red-600 text-white rounded-tr-none' 
                              : 'bg-gray-100 text-gray-800 rounded-tl-none'
                          }`}>
                            {msg.content}
                          </div>
                          <p className={`text-[10px] text-gray-400 ${isSelf ? 'text-right' : ''}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Other User Typing indicator */}
                {otherUserTyping && (
                  <div className="px-4 py-2 text-xs text-gray-400 italic">
                    {activeChat.other_user_name} is typing...
                  </div>
                )}

                {/* Chat Footer Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    className="flex-grow border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Type a message..."
                    value={newMessageText}
                    onChange={handleTextChange}
                    disabled={sending}
                  />
                  <button 
                    type="submit" 
                    className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50" 
                    disabled={sending || !newMessageText.trim()}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center p-8">
                <MessageSquare size={48} className="text-red-200 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Select a contact from the inbox to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">🚨 Raise Emergency Blood Request</h3>
            <p className="text-xs text-gray-500 mb-4">
              This will automatically identify and send a direct chat message + real-time Socket.IO alert to all matching donors and blood banks.
            </p>

            {emergencyError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl mb-4 font-semibold">
                {emergencyError}
              </div>
            )}

            <form onSubmit={handleRaiseEmergencySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Blood Type Needed *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setEmergencyForm({ ...emergencyForm, bloodType: bg })}
                      className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                        emergencyForm.bloodType === bg
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Patient Info / Room / Priority (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Patient: Jane, Room 302, Critical priority"
                  value={emergencyForm.patientInfo}
                  onChange={e => setEmergencyForm({ ...emergencyForm, patientInfo: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEmergencyModal(false); setEmergencyError(''); }}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 text-xs transition"
                  disabled={emergencyLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-xs transition disabled:opacity-50"
                  disabled={emergencyLoading}
                >
                  {emergencyLoading ? 'Broadcasting...' : 'Broadcast Alert'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Chat;
