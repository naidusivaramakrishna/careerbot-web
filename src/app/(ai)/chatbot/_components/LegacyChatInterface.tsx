'use client';

import React, { useState, useRef, useEffect } from 'react';
import './LegacyChatInterface.css';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
}

const CareerBot: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [selectedApp, setSelectedApp] = useState('CareerBot');
  const [showAppDropdown, setShowAppDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = 'http://localhost:8000';

  const apps = ['CareerBot', 'JobMatcher', 'MockInterview', 'ResumBuilder'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    initializeChat();
    loadChatHistory();
  }, []);

  const initializeChat = async () => {
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`${API_URL}/api/v1/support/chat/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);

        // Add welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          type: 'assistant',
          text: `Welcome to ${selectedApp}! How can I help you today?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      const fallbackMessage: Message = {
        id: 'error',
        type: 'assistant',
        text: `Welcome to ${selectedApp}! Ask me anything.`,
        timestamp: new Date(),
      };
      setMessages([fallbackMessage]);
    }
  };

  const loadChatHistory = () => {
    const history: ChatHistory[] = [
      { id: '1', title: 'Resume Review Discussion', timestamp: new Date(Date.now() - 86400000) },
      { id: '2', title: 'Job Search Tips', timestamp: new Date(Date.now() - 172800000) },
      { id: '3', title: 'Interview Preparation', timestamp: new Date(Date.now() - 259200000) },
      { id: '4', title: 'Career Path Planning', timestamp: new Date(Date.now() - 345600000) },
    ];
    setChatHistory(history);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim() || !sessionId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`${API_URL}/api/v1/support/chat/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: messageText,
          session_id: sessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: data.answer || 'I am processing your request.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="chatbot-minimized">
        <button
          className="restore-btn"
          onClick={() => setIsMinimized(false)}
        >
          <span className="restore-icon">💬</span>
          <span className="restore-text">{selectedApp}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-main">
        {/* History Sidebar */}
        <div className={`history-sidebar ${showHistory ? 'open' : ''}`}>
          <div className="history-header">
            <h3>Chat History</h3>
            <button
              className="close-history"
              onClick={() => setShowHistory(false)}
            >
              ✕
            </button>
          </div>
          <div className="history-list">
            {chatHistory.map((chat) => (
              <div key={chat.id} className="history-item">
                <div className="history-title">{chat.title}</div>
                <div className="history-date">
                  {chat.timestamp.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          <button className="new-chat-btn">+ New Chat</button>
        </div>

        {/* Chat Container */}
        <div className="chatbot-container">
          {/* Header */}
          <div className="chatbot-header">
            <div className="header-left">
              <button
                className="history-toggle"
                onClick={() => setShowHistory(!showHistory)}
                title="Chat History"
              >
                ☰
              </button>
              <div className="header-content">
                <h2>{selectedApp}</h2>
              </div>
            </div>

            <div className="header-right">
              {/* App Dropdown */}
              <div className="app-dropdown">
                <button
                  className="dropdown-btn"
                  onClick={() => setShowAppDropdown(!showAppDropdown)}
                  title="Switch Application"
                >
                  ⚙️
                </button>
                {showAppDropdown && (
                  <div className="dropdown-menu">
                    {apps.map((app) => (
                      <button
                        key={app}
                        className={`dropdown-item ${selectedApp === app ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedApp(app);
                          setShowAppDropdown(false);
                          setMessages([]);
                          initializeChat();
                        }}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Minimize Button */}
              <button
                className="minimize-btn"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                ➖
              </button>
            </div>
          </div>

          {/* Welcome Message */}
          {messages.length <= 1 && (
            <div className="welcome-section">
              <div className="welcome-content">
                <h3>Welcome to {selectedApp}</h3>
                <p>Ask me anything about your career journey</p>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-section">
            <div className="input-wrapper">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="input-field"
              />
              <button
                className="send-icon-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerBot;
