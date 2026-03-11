'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
} from 'lucide-react';
import DashboardLayout from '../dashboard/_components/DashboardLayout';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';

interface Message {
  id: number;
  sender: 'recruiter' | 'candidate';
  text: string;
  time: string;
}

interface Conversation {
  candidateId: number;
  candidateName: string;
  candidateInitials: string;
  candidateColor: string;
  position: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Message[];
}

const CONVERSATIONS: Conversation[] = [
  {
    candidateId: 1,
    candidateName: 'Pradeep Varma',
    candidateInitials: 'PV',
    candidateColor: 'bg-purple-100 text-purple-600',
    position: 'Backend Engineer',
    lastMessage: 'Thank you for the opportunity!',
    lastTime: '10:32 AM',
    unread: 2,
    messages: [
      { id: 1, sender: 'recruiter', text: 'Hi Pradeep, we have reviewed your application for the Backend Engineer role.', time: '10:00 AM' },
      { id: 2, sender: 'candidate', text: 'Hello! Thank you for reaching out. I am very excited about this opportunity.', time: '10:05 AM' },
      { id: 3, sender: 'recruiter', text: 'We would like to schedule a technical interview with you. Are you available this week?', time: '10:15 AM' },
      { id: 4, sender: 'candidate', text: 'Yes, I am available on Wednesday and Thursday afternoon. What time works best for you?', time: '10:20 AM' },
      { id: 5, sender: 'recruiter', text: 'Great! We will schedule it for Wednesday at 10:00 AM. You will receive a calendar invite shortly.', time: '10:28 AM' },
      { id: 6, sender: 'candidate', text: 'Thank you for the opportunity!', time: '10:32 AM' },
    ],
  },
  {
    candidateId: 2,
    candidateName: 'Naveen Kulkarni',
    candidateInitials: 'NK',
    candidateColor: 'bg-yellow-100 text-yellow-600',
    position: 'Marketing Manager',
    lastMessage: 'Looking forward to the interview.',
    lastTime: '9:45 AM',
    unread: 0,
    messages: [
      { id: 1, sender: 'recruiter', text: 'Hi Naveen, we are impressed with your profile for the Marketing Manager position.', time: '9:30 AM' },
      { id: 2, sender: 'candidate', text: 'Thank you! I have been following your company and I am really excited about this role.', time: '9:35 AM' },
      { id: 3, sender: 'recruiter', text: 'We would like to invite you for an HR round. Please join the Google Meet link we sent.', time: '9:40 AM' },
      { id: 4, sender: 'candidate', text: 'Looking forward to the interview.', time: '9:45 AM' },
    ],
  },
  {
    candidateId: 3,
    candidateName: 'Venkat',
    candidateInitials: 'V',
    candidateColor: 'bg-pink-100 text-pink-600',
    position: 'Marketing Manager',
    lastMessage: 'Sure, I will prepare the presentation.',
    lastTime: 'Yesterday',
    unread: 0,
    messages: [
      { id: 1, sender: 'recruiter', text: 'Hi Venkat, could you prepare a short 5-minute presentation on a recent marketing campaign for the interview?', time: 'Yesterday 3:00 PM' },
      { id: 2, sender: 'candidate', text: 'Sure, I will prepare the presentation.', time: 'Yesterday 3:15 PM' },
    ],
  },
  {
    candidateId: 4,
    candidateName: 'Pooja Menon',
    candidateInitials: 'PM',
    candidateColor: 'bg-green-100 text-green-600',
    position: 'Backend Engineer',
    lastMessage: 'I have attached my portfolio.',
    lastTime: 'Yesterday',
    unread: 1,
    messages: [
      { id: 1, sender: 'recruiter', text: 'Hi Pooja, could you share your portfolio or any open source contributions before the interview?', time: 'Yesterday 2:00 PM' },
      { id: 2, sender: 'candidate', text: 'I have attached my portfolio.', time: 'Yesterday 2:30 PM' },
    ],
  },
  {
    candidateId: 5,
    candidateName: 'Sudheer',
    candidateInitials: 'S',
    candidateColor: 'bg-blue-100 text-blue-600',
    position: 'Data Analyst',
    lastMessage: 'Understood, I will bring my work samples.',
    lastTime: 'Feb 18',
    unread: 0,
    messages: [
      { id: 1, sender: 'recruiter', text: 'Hi Sudheer, please bring any data analysis work samples or dashboards you have built.', time: 'Feb 18 11:00 AM' },
      { id: 2, sender: 'candidate', text: 'Understood, I will bring my work samples.', time: 'Feb 18 11:20 AM' },
    ],
  },
  {
    candidateId: 6,
    candidateName: 'Rajesh Kumar',
    candidateInitials: 'RK',
    candidateColor: 'bg-orange-100 text-orange-600',
    position: 'Frontend Developer',
    lastMessage: 'My GitHub profile is linked in my resume.',
    lastTime: 'Feb 17',
    unread: 0,
    messages: [
      { id: 1, sender: 'recruiter', text: 'Hi Rajesh, do you have a GitHub or portfolio link we can review before the technical round?', time: 'Feb 17 4:00 PM' },
      { id: 2, sender: 'candidate', text: 'My GitHub profile is linked in my resume.', time: 'Feb 17 4:15 PM' },
    ],
  },
];

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const candidateIdParam = Number(searchParams.get('candidateId'));
  const candidateNameParam = searchParams.get('candidateName') || '';

  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations from API on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await recruiterAuthApi.getConversations();
        if (response?.data) {
          // Map API response to conversation format
          const mappedConversations = response.data.map((conv: any) => ({
            candidateId: conv.id || conv.candidateId,
            candidateName: conv.candidateName || conv.name || '',
            candidateInitials: (conv.candidateName || conv.name || '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
            candidateColor: 'bg-gray-100 text-gray-600',
            position: conv.position || '',
            lastMessage: conv.lastMessage || 'No messages yet',
            lastTime: conv.lastTime || 'Now',
            unread: conv.unread || 0,
            messages: conv.messages || [],
          }));
          setConversations(mappedConversations);
        }
      } catch (err: any) {
        console.error('Failed to fetch conversations:', err);
        // Try to restore from localStorage on error
        try {
          const stored = localStorage.getItem('recruiterConversations');
          if (stored) {
            setConversations(JSON.parse(stored));
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Persist conversations to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('recruiterConversations', JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // Set active conversation from query params or default to first
  useEffect(() => {
    if (candidateIdParam) {
      const match = conversations.find(c => c.candidateId === candidateIdParam);
      if (match) {
        setActiveId(match.candidateId);
        // Mark conversation as read
        markConversationAsRead(match.candidateId);
      } else if (candidateNameParam) {
        // Candidate exists in interviews but not yet in conversations — create a new one
        createNewConversation(candidateIdParam, candidateNameParam);
      }
    } else {
      setActiveId(conversations[0]?.candidateId ?? null);
    }
  }, [candidateIdParam, candidateNameParam]);

  // Mark conversation as read when opening
  const markConversationAsRead = async (conversationId: number) => {
    try {
      await recruiterAuthApi.markConversationAsRead(conversationId);
      // Clear unread for this conversation
      setConversations(prev => prev.map(c =>
        c.candidateId === conversationId ? { ...c, unread: 0 } : c
      ));
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }
  };

  // Create new conversation
  const createNewConversation = async (candidateId: number, candidateName: string) => {
    try {
      const response = await recruiterAuthApi.createConversation({ candidateId, candidateName });
      const newConvo: Conversation = {
        candidateId: candidateId,
        candidateName: candidateName,
        candidateInitials: candidateName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        candidateColor: 'bg-gray-100 text-gray-600',
        position: searchParams.get('position') || '',
        lastMessage: 'No messages yet',
        lastTime: 'Now',
        unread: 0,
        messages: [],
      };
      setConversations(prev => [newConvo, ...prev]);
      setActiveId(candidateId);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      // Still create conversation locally if API fails
      const newConvo: Conversation = {
        candidateId: candidateId,
        candidateName: candidateName,
        candidateInitials: candidateName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        candidateColor: 'bg-gray-100 text-gray-600',
        position: searchParams.get('position') || '',
        lastMessage: 'No messages yet',
        lastTime: 'Now',
        unread: 0,
        messages: [],
      };
      setConversations(prev => [newConvo, ...prev]);
      setActiveId(candidateId);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, conversations]);

  const activeConvo = conversations.find(c => c.candidateId === activeId) ?? null;

  const handleSend = async () => {
    if (!newMessage.trim() || !activeId) return;

    setSendingMessage(true);
    try {
      // Send message through API
      await recruiterAuthApi.sendMessage(activeId, { text: newMessage.trim() });

      // Update local state optimistically
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const msg: Message = { id: Date.now(), sender: 'recruiter', text: newMessage.trim(), time };

      setConversations(prev => prev.map(c =>
        c.candidateId === activeId
          ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastTime: time }
          : c
      ));
      setNewMessage('');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to send message';
      setError(errorMsg);
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filtered = conversations.filter(c =>
    c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-10rem)] flex rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">

        {/* ── Left: Conversation List ── */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => router.back()}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-base font-bold text-gray-900">Messages</h2>
              <div className="w-8" />
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-8">No conversations found</p>
            ) : (
              filtered.map(convo => (
                <button
                  key={convo.candidateId}
                  onClick={() => {
                    setActiveId(convo.candidateId);
                    setConversations(prev => prev.map(c =>
                      c.candidateId === convo.candidateId ? { ...c, unread: 0 } : c
                    ));
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition border-b border-gray-100 ${
                    activeId === convo.candidateId ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${convo.candidateColor}`}>
                    {convo.candidateInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{convo.candidateName}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{convo.lastTime}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{convo.position}</p>
                    <div className="flex items-center justify-between mt-0.5" suppressHydrationWarning>
                      <p className="text-xs text-gray-400 truncate">{convo.lastMessage}</p>
                      {convo.unread > 0 && (
                        <span className="ml-1 flex-shrink-0 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {convo.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Chat Window ── */}
        {activeConvo ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${activeConvo.candidateColor}`}>
                  {activeConvo.candidateInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{activeConvo.candidateName}</p>
                  <p className="text-xs text-gray-500">{activeConvo.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
              {activeConvo.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${activeConvo.candidateColor}`}>
                    {activeConvo.candidateInitials}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{activeConvo.candidateName}</p>
                  <p className="text-xs text-gray-400">Start the conversation</p>
                </div>
              ) : (
                activeConvo.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'recruiter' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'candidate' && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mr-2 mt-1 ${activeConvo.candidateColor}`}>
                        {activeConvo.candidateInitials}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'recruiter'
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <p className={`text-xs text-gray-400 mt-1 ${msg.sender === 'recruiter' ? 'text-right' : 'text-left'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <button className="p-1 text-gray-400 hover:text-gray-600 transition" disabled={sendingMessage}>
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder={`Message ${activeConvo.candidateName}...`}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sendingMessage}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
                />
                <button className="p-1 text-gray-400 hover:text-gray-600 transition disabled:opacity-50" disabled={sendingMessage}>
                  <Smile className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <span className="inline-block animate-spin">⏳</span>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-center">Press Enter to send</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <p className="text-gray-400 text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex items-center justify-center h-screen">Loading messages...</div></DashboardLayout>}>
      <MessagesPageContent />
    </Suspense>
  );
}
