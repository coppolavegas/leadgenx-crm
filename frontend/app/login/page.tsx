'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { APIError } from '@/lib/api-client';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      router.push('/clients');
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] px-4 py-10">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E4AFF] rounded-full blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4DE3FF] rounded-full blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block">
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_30px_rgba(110,74,255,0.4)] group-hover:shadow-[0_0_40px_rgba(110,74,255,0.6)] transition-all">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-[#EDEEF2]">LeadGenX</span>
            </Link>
            
            <h1 className="text-4xl font-bold text-[#EDEEF2] mb-4 leading-tight">
              Welcome Back to Your
              <span className="block bg-gradient-to-r from-[#6E4AFF] to-[#4DE3FF] bg-clip-text text-transparent">
                Lead Generation Hub
              </span>
            </h1>
            
            <p className="text-lg text-[#8B90A0] mb-8 leading-relaxed">
              Access your campaigns, manage clients, and discover qualified leads with AI-powered intelligence.
            </p>
            
            <div className="space-y-3">
              {[
                'Campaign-based lead discovery',
                'Multi-client workspace management',
                'Real-time enrichment & scoring'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <span className="text-[#EDEEF2]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <GlassPanel intensity="strong" className="p-8 lg:p-10">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-[#EDEEF2] mb-2">Sign In</h2>
              <p className="text-[#8B90A0]">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center space-x-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 p-3 text-sm text-[#EF4444]">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#EDEEF2]">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  className="h-11 bg-[#141824]/50 border-[#8B90A0]/30 text-[#EDEEF2] placeholder:text-[#8B90A0]/50 focus:border-[#6E4AFF] focus:ring-[#6E4AFF]/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#EDEEF2]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-11 bg-[#141824]/50 border-[#8B90A0]/30 text-[#EDEEF2] placeholder:text-[#8B90A0]/50 focus:border-[#6E4AFF] focus:ring-[#6E4AFF]/20"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium shadow-[0_0_20px_rgba(110,74,255,0.3)] hover:shadow-[0_0_30px_rgba(110,74,255,0.5)] transition-all" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center pt-4 border-t border-[#8B90A0]/20">
                <span className="text-[#8B90A0]">Don't have an account? </span>
                <Link href="/register" className="text-[#4DE3FF] hover:text-[#6E4AFF] transition-colors font-medium">
                  Create account
                </Link>
              </div>

              <p className="text-xs text-center text-[#8B90A0] pt-2">
                14-day free trial • No credit card required
              </p>
            </form>

            {/* Mobile Branding */}
            <div className="lg:hidden mt-8 pt-8 border-t border-[#8B90A0]/20 text-center">
              <Link href="/" className="inline-flex items-center gap-2 text-[#8B90A0] hover:text-[#EDEEF2] transition-colors">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Back to LeadGenX Home</span>
              </Link>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}