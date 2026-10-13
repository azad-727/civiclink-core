import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import apiClient from '../apiClient';
import './ChatWidget.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm the CivicLink assistant. Ask me about the status of a reported issue, or anything else about civic issues in your area.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isSending]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      // Routed through api-gateway (/api/v1/ai/**) to ai-vision-service's
      // /api/v1/ai/chat endpoint.
      const data = await apiClient.post('/ai/chat', { user_message: trimmed });
      const botReply = data?.reply || data?.response || (typeof data === 'string' ? data : "I'm here to help with civic issues in your area.");
      setMessages((prev) => [...prev, { role: 'assistant', text: botReply }]);
    } catch (err) {
      setError(err?.message || 'The assistant is currently unavailable.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "The assistant server is warming up or temporarily busy. Please try again in a few seconds." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-widget-root">
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-title">
              <MessageCircle size={18} />
              <span>CivicLink Assistant</span>
            </div>
            <button className="chat-close-btn" onClick={toggleOpen} aria-label="Close chat">
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={msg.role === 'user' ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-assistant'}
              >
                {msg.text}
              </div>
            ))}

            {isSending && (
              <div className="chat-bubble chat-bubble-assistant chat-bubble-loading">
                <Loader2 size={16} className="chat-spinner" />
                <span>Thinking...</span>
              </div>
            )}

            {error && <div className="chat-error-note">{error}</div>}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              placeholder="Ask about an issue, or anything civic..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={isSending || !input.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        className="chat-fab"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}