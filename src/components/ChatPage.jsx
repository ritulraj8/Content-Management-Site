import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';

export default function ChatPage() {
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
    scrollToBottom();
  }, [messages, isTyping]);

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
    <div className="mx-auto w-full max-w-4xl bg-white border border-neutral-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-10rem)] min-h-[500px] dark:bg-editorial-bg-dark dark:border-neutral-800 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-100 bg-editorial-cream/50 px-6 py-5 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-editorial-gold/10 text-editorial-gold">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-editorial-ink dark:text-neutral-100">
            Artisite Guide
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Ask me anything about design, history, or our essays
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0 bg-neutral-50/50 dark:bg-neutral-900/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-3xl px-5 py-3.5 text-base leading-relaxed ${
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
            <div className="bg-white border border-neutral-100 text-editorial-ink rounded-3xl rounded-bl-none px-5 py-4 shadow-sm dark:bg-editorial-card-dark dark:border-neutral-800 dark:text-neutral-200">
              <Loader2 className="h-5 w-5 animate-spin text-editorial-gold" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-100 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-editorial-bg-dark">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message here..."
            className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-3 sm:py-4 pl-6 pr-14 text-base text-editorial-ink placeholder:text-neutral-400 focus:border-editorial-gold focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-editorial-gold"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="absolute right-2 sm:right-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-editorial-gold text-white hover:bg-editorial-gold/90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
