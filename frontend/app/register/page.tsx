'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Sparkles, AlertCircle, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { APIError } from '@/lib/api-client';

const INDUSTRIES = [
  'Technology / SaaS',
  'Marketing Agency',
  'Consulting',
  'E-commerce',
  'Finance / Fintech',
  'Healthcare',
  'Real Estate',
  'Manufacturing',
  'Education',
  'Other'
];

const ROLES = [
  'Founder / CEO',
  'Sales Leader',
  'Marketing Leader',
  'Business Development',
  'Operations',
  'Agency Owner',
  'Consultant',
  'Other'
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    company_name: '',
    title: '',
    industry: '',
    website: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Work email is required');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return;
    }
    if (!formData.title) {
      setError('Role is required');
      return;
    }
    if (!formData.industry) {
      setError('Industry is required');
      return;
    }

    try {
      setLoading(true);
      await register({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        company_name: formData.company_name.trim(),
        title: formData.title,
        industry: formData.industry,
        website: formData.website.trim() || undefined,
      });
      
      router.push('/clients');
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Registration failed');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] px-4 py-10">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E4AFF] rounded-full blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4DE3FF] rounded-full blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left Side - Value Props */}
          <div className="hidden lg:block lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_30px_rgba(110,74,255,0.4)] group-hover:shadow-[0_0_40px_rgba(110,74,255,0.6)] transition-all">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-[#EDEEF2]">LeadGenX</span>
            </Link>
            
            <h1 className="text-4xl font-bold text-[#EDEEF2] mb-4 leading-tight">
              Start Generating
              <span className="block bg-gradient-to-r from-[#6E4AFF] to-[#4DE3FF] bg-clip-text text-transparent">
                Qualified Leads Today
              </span>
            </h1>
            
            <p className="text-lg text-[#8B90A0] mb-8 leading-relaxed">
              Join hundreds of sales teams using AI to discover, enrich, and convert high-intent buyers.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Zap, text: '14-day free trial', sub: 'No credit card required' },
                { icon: CheckCircle2, text: '98% data accuracy', sub: 'Verified contacts only' },
                { icon: Sparkles, text: 'AI-powered discovery', sub: 'No manual scraping needed' }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <GlassPanel key={i} intensity="medium" className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6E4AFF]/20 to-[#4DE3FF]/20 flex items-center justify-center flex-shrink-0 border border-[#6E4AFF]/30">
                        <Icon className="w-5 h-5 text-[#4DE3FF]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#EDEEF2]">{item.text}</p>
                        <p className="text-sm text-[#8B90A0]">{item.sub}</p>
                      </div>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="lg:col-span-3">
            <GlassPanel intensity="strong" className="p-8 lg:p-10">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-[#EDEEF2] mb-2">Create Your Account</h2>
                <p className="text-[#8B90A0]">
                  {planParam === 'trial' ? 'Start your 14-day free trial' : 'Get started with LeadGenX today'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center space-x-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 p-3 text-sm text-[#EF4444]">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name" className="text-[#EDEEF2]">Full Name *</Label>
                    <Input
                      id="full-name"
                      placeholder="John Smith"
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      disabled={loading}
                      autoComplete="name"
                      className="h-11 bg-[#141824]/50 border-[#8B90A0]/30 text-[#EDEEF2] placeholder:text-[#8B90A0]/50 focus:border-[#6E4AFF] focus:ring-[#6E4AFF]/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#EDEEF2]">Work Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                      className="h-11 bg-[#141824]/50 border-[#8B90A0]/30 text-[#EDEEF2] placeholder:text-[#8B90A0]/50 focus:border-[#6E4AFF] focus:ring-[#6E4AFF]/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#EDEEF2]">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                    className="h-11 bg-[#141824]/50 border-[#8B90A0]/30 text-[#EDEEF2] placeholder:text-[#8B90A0]/50 focus:border-[#6E4AFF] focus:ring-[#6E4AFF]/20"
                  />
                </div>

                {/* Company Info */}
                <div className="pt-6 border-t border-[#8B90A0]/20">
                  <h3 className="text-base font-medium text-[#EDEEF2] mb-4">About Your Business</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name" className="text-[#EDEEF2]">Company Name *</Label>
                      <Input
                        id="company-name"
                        placeholder="Acme Inc"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        disabled={loading}
                        autoComplete="organization"
                        className="h-11 bg-[#141824]/50 border-[#8B90A0]/30 text-[#EDEEF2] placeholder:text-[#8B90A0]/50 focus:border-[#6E4AFF] focus:ring-[#6E4AFF]/20"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-[#EDEEF2]">Your Role *</Label>
                        <select
                          id="role"
                          value={formData.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                          disabled={loading}
                          className="flex h-11 w-full rounded-md border border-[#8B90A0]/30 bg-[#141824]/50 px-3 py-2 text-sm text-[#EDEEF2] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6E4AFF] focus-visible:border-[#6E4AFF] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" className="bg-[#141824]">Select your role...</option>
                          {ROLES.map(role => (
                            <option key={role} value={role} className="bg-[#141824]">{role}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry" className="text-[#EDEEF2]">Industry *</Label>
                        <select
                          id="industry"
                          value={formData.industry}
                          onChange={(e) => handleChange('industry', e.target.value)}
                          disabled={loading}
                          className="flex h-11 w-full rounded-md border border-[#8B90A0]/30 bg-[#141824]/50 px-3 py-2 text-sm text-[#EDEEF2] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6E4AFF] focus-visible:border-[#6E4AFF] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" className="bg-[#141824]">Select industry...</option>
                          {INDUSTRIES.map(industry => (
                            <option key={industry} value={industry} className="bg-[#141824]">{industry}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-[#EDEEF2]">Company Website (Optional)</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        disabled={loading}
                        autoComplete="url"
                        className="h-11 bg-[#141824]/50 border-[#8B90A0]/30 text-[#EDEEF2] placeholder:text-[#8B90A0]/50 focus:border-[#6E4AFF] focus:ring-[#6E4AFF]/20"
                      />
                      <p className="text-xs text-[#8B90A0]">Helps us tailor your experience</p>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium shadow-[0_0_20px_rgba(110,74,255,0.3)] hover:shadow-[0_0_30px_rgba(110,74,255,0.5)] transition-all" 
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : (
                    <>
                      Create Account & Start Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-4 border-t border-[#8B90A0]/20">
                  <span className="text-[#8B90A0]">Already have an account? </span>
                  <Link href="/login" className="text-[#4DE3FF] hover:text-[#6E4AFF] transition-colors font-medium">
                    Sign in
                  </Link>
                </div>

                <p className="text-xs text-center text-[#8B90A0] pt-2">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                  <br />
                  <span className="inline-flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    14-day free trial • No credit card required
                  </span>
                </p>
              </form>

              {/* Mobile Back Link */}
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
    </div>
  );
}