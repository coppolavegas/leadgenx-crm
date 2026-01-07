'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommended_action?: 'demo' | 'trial';
}

export function GenieChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Genie, your AI lead generation assistant. I'm here to help you find the right solution for your business. Tell me a bit about your team and goals?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://leadgenx.app';
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'lgx_13vCsXjmzMQw7kKlWNo_A5ZMKdzg7pdfzRnA5csaBCY';

      // Start conversation if first message
      if (!conversationId) {
        const startRes = await fetch(`${API_BASE}/genie/conversation/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          },
          body: JSON.stringify({
            visitor_metadata: {
              referrer: document.referrer || 'direct',
              utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'organic'
            }
          })
        });

        if (!startRes.ok) throw new Error('Failed to start conversation');
        const startData = await startRes.json();
        setConversationId(startData.conversation_id);
      }

      // Send message
      const sendRes = await fetch(`${API_BASE}/genie/conversation/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: userMessage
        })
      });

      if (!sendRes.ok) throw new Error('Failed to send message');
      const data = await sendRes.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || data.response,
        recommended_action: data.qualification?.recommended_action
      }]);

      // Handle routing based on recommendation
      if (data.qualification?.recommended_action) {
        const action = data.qualification.recommended_action;
        setTimeout(() => {
          if (action === 'demo') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: "Perfect! I'd love to show you a personalized demo. Click below to schedule:"
            }]);
          } else if (action === 'trial') {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: "Great! You can start exploring LeadGenX right away with a free trial. Click below to get started:"
            }]);
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Genie chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try refreshing or contact our team directly."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteToDemo = () => {
    setIsOpen(false);
    router.push('/demo');
  };

  const handleRouteToTrial = () => {
    setIsOpen(false);
    router.push('/register?plan=trial');
  };

  const getLastRecommendation = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].recommended_action) {
        return messages[i].recommended_action;
      }
    }
    return null;
  };

  const lastRecommendation = getLastRecommendation();

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_30px_rgba(110,74,255,0.5)] hover:shadow-[0_0_40px_rgba(110,74,255,0.7)] transition-all hover:scale-110 animate-pulse"
          aria-label="Chat with Genie AI"
        >
          <Sparkles className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)]">
          <GlassPanel intensity="strong" withGlow="purple" className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#8B90A0]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_20px_rgba(110,74,255,0.4)]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#EDEEF2]">Genie AI</h3>
                  <p className="text-xs text-[#8B90A0]">Your Lead Gen Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#8B90A0]/10 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-[#8B90A0]" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] text-white'
                        : 'bg-[#141824]/50 border border-[#8B90A0]/20 text-[#EDEEF2]'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {/* CTA Buttons if recommendation exists */}
              {lastRecommendation && (
                <div className="flex flex-col gap-2 pt-2">
                  {lastRecommendation === 'demo' && (
                    <Button
                      onClick={handleRouteToDemo}
                      className="w-full shadow-[0_0_20px_rgba(110,74,255,0.4)]"
                      size="sm"
                    >
                      Schedule Demo
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                  {lastRecommendation === 'trial' && (
                    <Button
                      onClick={handleRouteToTrial}
                      className="w-full shadow-[0_0_20px_rgba(110,74,255,0.4)]"
                      size="sm"
                    >
                      Start Free Trial
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#141824]/50 border border-[#8B90A0]/20 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#6E4AFF] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#6E4AFF] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#6E4AFF] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#8B90A0]/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Tell me about your business..."
                  className="flex-1 px-4 py-2 bg-[#141824]/50 border border-[#8B90A0]/20 rounded-xl text-[#EDEEF2] placeholder-[#8B90A0]/50 focus:outline-none focus:ring-2 focus:ring-[#6E4AFF] focus:border-transparent transition-all text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(110,74,255,0.5)] transition-all"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  );
}