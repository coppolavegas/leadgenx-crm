"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { CheckCircle2, Sparkles, ArrowRight, Calendar, Shield, Zap, Users } from "lucide-react";
import Link from "next/link";
import { useState, FormEvent } from "react";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    industry: '',
    companySize: '',
    challenge: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock submit (prepare for Calendly or backend integration)
    console.log('Demo request submitted:', formData);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0B0E14] overflow-hidden flex items-center justify-center">
        {/* Ambient Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E4AFF] rounded-full blur-[128px] opacity-20 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4DE3FF] rounded-full blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative px-4 py-20 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <GlassPanel intensity="strong" withGlow="purple" className="p-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#EDEEF2] mb-4">
              Thanks! We're Preparing Your Custom Demo
            </h1>
            <p className="text-lg text-[#8B90A0] mb-8 leading-relaxed">
              Our team will reach out within 24 hours to schedule a personalized walkthrough of LeadGenX tailored to <span className="text-[#4DE3FF] font-semibold">{formData.company || 'your business'}</span>.
            </p>
            <div className="bg-[#141824]/50 rounded-xl p-6 mb-8 border border-[#8B90A0]/10">
              <h3 className="text-sm font-semibold text-[#EDEEF2] mb-4">What happens next?</h3>
              <ul className="space-y-3 text-left">
                {[
                  'We\'ll review your use case and prepare a custom demo',
                  'You\'ll receive a calendar invite within 24 hours',
                  'Demo includes live Q&A and strategy session',
                  'No sales pressure — just a genuine conversation',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#8B90A0]">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#10B981] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button variant="glass" size="lg">
                  Back to Homepage
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg">
                  Or Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E4AFF] rounded-full blur-[128px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4DE3FF] rounded-full blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_20px_rgba(110,74,255,0.5)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#EDEEF2]">LeadGenX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="glass">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Demo Request Section */}
      <section className="relative px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left: Form */}
            <div className="lg:col-span-3">
              <div className="mb-8">
                <Badge variant="primary" className="mb-4">
                  <Calendar className="w-3 h-3" />
                  Enterprise Demo Request
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold text-[#EDEEF2] mb-4">
                  See How LeadGenX Finds Sales-Ready Leads for Your Business
                </h1>
                <p className="text-lg text-[#8B90A0] leading-relaxed">
                  Schedule a personalized demo and discover how AI-powered lead generation can transform your sales pipeline.
                </p>
              </div>

              <GlassPanel intensity="medium" className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-[#EDEEF2] mb-2">
                      Full Name <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#141824]/50 border border-[#8B90A0]/20 rounded-xl text-[#EDEEF2] placeholder-[#8B90A0]/50 focus:outline-none focus:ring-2 focus:ring-[#6E4AFF] focus:border-transparent transition-all"
                      placeholder="John Smith"
                    />
                  </div>

                  {/* Business Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#EDEEF2] mb-2">
                      Business Email <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#141824]/50 border border-[#8B90A0]/20 rounded-xl text-[#EDEEF2] placeholder-[#8B90A0]/50 focus:outline-none focus:ring-2 focus:ring-[#6E4AFF] focus:border-transparent transition-all"
                      placeholder="john@company.com"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-[#EDEEF2] mb-2">
                      Company Name <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#141824]/50 border border-[#8B90A0]/20 rounded-xl text-[#EDEEF2] placeholder-[#8B90A0]/50 focus:outline-none focus:ring-2 focus:ring-[#6E4AFF] focus:border-transparent transition-all"
                      placeholder="Acme Inc."
                    />
                  </div>

                  {/* Industry */}
                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-[#EDEEF2] mb-2">
                      Industry <span className="text-[#EF4444]">*</span>
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      required
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#141824]/50 border border-[#8B90A0]/20 rounded-xl text-[#EDEEF2] focus:outline-none focus:ring-2 focus:ring-[#6E4AFF] focus:border-transparent transition-all"
                    >
                      <option value="">Select industry...</option>
                      <option value="saas">SaaS / Software</option>
                      <option value="agency">Marketing Agency</option>
                      <option value="consulting">Consulting</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="finance">Finance / Fintech</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Company Size */}
                  <div>
                    <label htmlFor="companySize" className="block text-sm font-medium text-[#EDEEF2] mb-2">
                      Company Size <span className="text-[#EF4444]">*</span>
                    </label>
                    <select
                      id="companySize"
                      name="companySize"
                      required
                      value={formData.companySize}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#141824]/50 border border-[#8B90A0]/20 rounded-xl text-[#EDEEF2] focus:outline-none focus:ring-2 focus:ring-[#6E4AFF] focus:border-transparent transition-all"
                    >
                      <option value="">Select company size...</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-1000">201-1,000 employees</option>
                      <option value="1000+">1,000+ employees</option>
                    </select>
                  </div>

                  {/* Biggest Challenge */}
                  <div>
                    <label htmlFor="challenge" className="block text-sm font-medium text-[#EDEEF2] mb-2">
                      Biggest Lead Generation Challenge <span className="text-[#8B90A0] font-normal">(Optional)</span>
                    </label>
                    <textarea
                      id="challenge"
                      name="challenge"
                      rows={4}
                      value={formData.challenge}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#141824]/50 border border-[#8B90A0]/20 rounded-xl text-[#EDEEF2] placeholder-[#8B90A0]/50 focus:outline-none focus:ring-2 focus:ring-[#6E4AFF] focus:border-transparent transition-all resize-none"
                      placeholder="Tell us about your current lead generation process and any specific challenges you're facing..."
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full shadow-[0_0_30px_rgba(110,74,255,0.4)]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Schedule My Demo'}
                    <Calendar className="w-4 h-4" />
                  </Button>

                  <p className="text-xs text-[#8B90A0] text-center">
                    By submitting, you agree to receive demo scheduling emails. We respect your privacy and won't spam you.
                  </p>
                </form>
              </GlassPanel>
            </div>

            {/* Right: Benefits & Trust Signals */}
            <div className="lg:col-span-2 space-y-6">
              {/* What to Expect */}
              <GlassPanel intensity="medium" className="p-6">
                <h3 className="text-lg font-bold text-[#EDEEF2] mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#6E4AFF]" />
                  What to Expect
                </h3>
                <ul className="space-y-3">
                  {[
                    { icon: Calendar, text: '30-minute personalized walkthrough' },
                    { icon: Users, text: 'See your ICP in action with real data' },
                    { icon: CheckCircle2, text: 'Strategy session with lead gen expert' },
                    { icon: Shield, text: 'No sales pressure, just value' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#8B90A0]">
                      <item.icon className="w-4 h-4 mt-0.5 text-[#4DE3FF] flex-shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </GlassPanel>

              {/* Why Teams Choose LeadGenX */}
              <GlassPanel intensity="strong" withGlow="purple" className="p-6">
                <h3 className="text-lg font-bold text-[#EDEEF2] mb-4">
                  Why Teams Choose LeadGenX
                </h3>
                <div className="space-y-4">
                  {[
                    { stat: '10x', label: 'Faster lead discovery' },
                    { stat: '98%', label: 'Data accuracy rate' },
                    { stat: '3x', label: 'More qualified meetings' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_20px_rgba(110,74,255,0.3)]">
                        <span className="text-2xl font-bold text-white">{item.stat}</span>
                      </div>
                      <span className="text-sm text-[#8B90A0]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              {/* Not Ready? */}
              <Card className="p-6 bg-[#141824]/30">
                <h3 className="text-sm font-bold text-[#EDEEF2] mb-3">
                  Not ready for a demo?
                </h3>
                <p className="text-sm text-[#8B90A0] mb-4">
                  Start your free trial and explore LeadGenX at your own pace. No credit card required.
                </p>
                <Link href="/register">
                  <Button variant="glass" size="sm" className="w-full">
                    Start Free Trial
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
