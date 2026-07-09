import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';

export default function ChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! I am the Artisite assistant. How can I help you explore our essays today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: inputText };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Call backend API
    try {
      const res = await fetch('/python-api/faqs/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: inputText })
      });
      const data = await res.json();
      
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: data.answer || data.error || 'Sorry, something went wrong.'
        }
      ]);
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Error connecting to the chat server.'
        }
      ]);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 md:w-96 h-[600px] max-h-[75vh] rounded-2xl border border-neutral-200 bg-white shadow-xl flex flex-col overflow-hidden dark:border-neutral-800 dark:bg-editorial-bg-dark transition-all duration-300 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 bg-editorial-cream/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-editorial-gold/10 text-editorial-gold">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-editorial-ink dark:text-neutral-100">
              Artisite Guide
            </h3>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Always here to help
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-neutral-50/50 dark:bg-neutral-900/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender === 'user'
                  ? 'bg-editorial-charcoal text-white rounded-br-none dark:bg-neutral-800'
                  : 'bg-white border border-neutral-100 text-editorial-ink rounded-bl-none shadow-sm dark:bg-editorial-card-dark dark:border-neutral-800 dark:text-neutral-200'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-neutral-100 text-editorial-ink rounded-2xl rounded-bl-none px-4 py-3 shadow-sm dark:bg-editorial-card-dark dark:border-neutral-800 dark:text-neutral-200">
              <Loader2 className="h-4 w-4 animate-spin text-editorial-gold" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-100 bg-white p-3 dark:border-neutral-800 dark:bg-editorial-bg-dark">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-4 pr-12 text-sm text-editorial-ink placeholder:text-neutral-400 focus:border-editorial-gold focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-editorial-gold"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-editorial-gold text-white hover:bg-editorial-gold/90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-3 w-3 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
