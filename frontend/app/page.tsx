"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { CheckCircle2, Target, Zap, Database, ArrowRight, Sparkles, Shield, TrendingUp, Users, Settings, Search, Filter, MessageSquare, Lock, Award, Building2, Globe, ChevronDown, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { GenieChatWidget } from "@/components/genie-chat-widget";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_20px_rgba(110,74,255,0.5)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#EDEEF2]">LeadGenX</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="hidden sm:inline">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/demo">
              <Button variant="glass">Book Demo</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-6 animate-pulse-glow-purple">
              <Sparkles className="w-3 h-3" />
              No Scraped Junk. Verified Sources. Built for Enterprise.
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="block text-[#EDEEF2]">AI Lead Generation That</span>
              <span className="block bg-gradient-to-r from-[#6E4AFF] via-[#9370FF] to-[#4DE3FF] bg-clip-text text-transparent">
                Finds, Qualifies, and Converts Buyers — Automatically
              </span>
            </h1>
            
            <div className="mt-3 space-y-1">
              <p className="text-sm font-semibold tracking-wide text-foreground/80">
                Powered by <span className="text-foreground">GenX OS</span>
              </p>
              <p className="text-sm text-muted-foreground">
                AI automation that thinks in workflows, not buzzwords.
              </p>
            </div>
            
            <p className="text-lg sm:text-xl text-[#8B90A0] max-w-3xl mx-auto mb-10 leading-relaxed">
              Launch campaigns by industry, enrich contacts, verify intent, and manage leads in a CRM per client. No manual scraping. No junk data.
            </p>
            
            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Link href="/demo">
                <Button size="lg" className="w-full sm:w-auto min-w-[220px] shadow-[0_0_30px_rgba(110,74,255,0.4)] text-base">
                  Get a Live Demo
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <button
                onClick={() => document.getElementById('genie-chat-trigger')?.click()}
                className="text-[#4DE3FF] hover:text-[#6E4AFF] transition-colors text-base font-medium flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Or talk to Genie AI
              </button>
            </div>

            {/* Trust Microcopy */}
            <p className="text-sm text-[#8B90A0] flex items-center justify-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                Privacy-first
              </span>
              <span className="hidden sm:inline text-[#8B90A0]">•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-[#4DE3FF]" />
                Enterprise-grade AI
              </span>
              <span className="hidden sm:inline text-[#8B90A0]">•</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-[#6E4AFF]" />
                14-day free trial
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - 4 STEPS */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#EDEEF2] mb-4">
              How LeadGenX Works
            </h2>
            <p className="text-lg text-[#8B90A0]">
              From campaign setup to qualified leads in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Define Your Campaign',
                description: 'Set your target industry, geography, company size, and decision-maker roles. No technical setup required.'
              },
              {
                step: '02',
                icon: Database,
                title: 'AI Discovers & Enriches',
                description: 'Our AI finds leads from verified sources, enriches with emails, phone numbers, and intent signals automatically.'
              },
              {
                step: '03',
                icon: Filter,
                title: 'Filter & Qualify',
                description: 'Apply custom filters, blocklists, and scoring rules. Only sales-ready leads make it to your CRM.'
              },
              {
                step: '04',
                icon: Target,
                title: 'Export or Automate',
                description: 'Push leads to your CRM, trigger outreach campaigns, or export to CSV. Integrate with AutoGenX for full automation.'
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <GlassPanel key={i} intensity="medium" className="p-6 hover:scale-105 transition-transform">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center shadow-[0_0_20px_rgba(110,74,255,0.3)]">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-[#6E4AFF]/30">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#EDEEF2] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#8B90A0] leading-relaxed">{item.description}</p>
                </GlassPanel>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET - FEATURES GRID */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8 bg-[#141824]/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#EDEEF2] mb-4">
              Everything You Need to Generate Pipeline
            </h2>
            <p className="text-lg text-[#8B90A0]">
              Built for agencies, sales teams, and enterprise go-to-market
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: 'Campaign-Based Lead Discovery',
                description: 'Create unlimited campaigns targeting specific industries, geographies, and buyer personas. No manual list building.'
              },
              {
                icon: Globe,
                title: 'Website/Domain-Based Targeting',
                description: 'Target companies by domain or website. Extract org charts, emails, and phone numbers from verified sources.'
              },
              {
                icon: Database,
                title: 'Multi-Source Enrichment',
                description: 'Enrich leads with emails, direct dials, social profiles, and firmographics from 20+ premium data providers.'
              },
              {
                icon: CheckCircle2,
                title: 'Verified Contact Info',
                description: 'All emails and phones are verified in real-time. 98%+ accuracy. No bounces, no wasted outreach.'
              },
              {
                icon: Building2,
                title: 'CRM Per Client/Workspace',
                description: 'Agencies: manage multiple clients with separate CRMs, campaigns, and billing. Full workspace isolation.'
              },
              {
                icon: Zap,
                title: 'Automation-Ready (AutoGenX)',
                description: 'Export leads directly to email sequences, LinkedIn workflows, or CRM. Integrate with AutoGenX for end-to-end automation.'
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <GlassPanel key={i} intensity="medium" className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6E4AFF]/20 to-[#4DE3FF]/20 flex items-center justify-center mb-4 border border-[#6E4AFF]/30">
                    <Icon className="w-6 h-6 text-[#4DE3FF]" />
                  </div>
                  <h3 className="text-base font-bold text-[#EDEEF2] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#8B90A0] leading-relaxed">{item.description}</p>
                </GlassPanel>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST & COMPLIANCE */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-4">
              <Shield className="w-3 h-3" />
              Privacy-First by Design
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#EDEEF2] mb-4">
              Trusted Data You Can Rely On
            </h2>
            <p className="text-lg text-[#8B90A0] max-w-2xl mx-auto">
              We don't scrape. We don't buy lists. Every lead is sourced from verified, compliant channels.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <GlassPanel intensity="strong" className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#EDEEF2] mb-2">Data Provenance</h3>
              <p className="text-sm text-[#8B90A0]">
                All data sourced from public business directories, Google Maps, LinkedIn public profiles, and verified APIs. No gray-area scraping.
              </p>
            </GlassPanel>

            <GlassPanel intensity="strong" className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(110,74,255,0.3)]">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#EDEEF2] mb-2">Security & Encryption</h3>
              <p className="text-sm text-[#8B90A0]">
                End-to-end encryption, SOC 2 Type II controls, role-based access, and full audit trails for enterprise compliance.
              </p>
            </GlassPanel>

            <GlassPanel intensity="strong" className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#EDEEF2] mb-2">Rate Limits & Compliance</h3>
              <p className="text-sm text-[#8B90A0]">
                Built-in rate limiting and compliance safeguards ensure you stay within provider terms and data privacy laws (GDPR, CCPA).
              </p>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* CUSTOMER OUTCOMES - TESTIMONIALS PLACEHOLDERS */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8 bg-[#141824]/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-4">
              <Award className="w-3 h-3" />
              Trusted by Growth Teams
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#EDEEF2] mb-4">
              What Our Customers Are Saying
            </h2>
            <p className="text-lg text-[#8B90A0]">
              Real results from real businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                quote: "LeadGenX replaced our entire lead research process. We went from 5 hours/week to 5 minutes. The data quality is unmatched.",
                author: "Sarah Chen",
                role: "Head of Sales",
                company: "TechFlow Solutions"
              },
              {
                quote: "As an agency, managing multiple client workspaces is a game-changer. Each client gets their own CRM and campaigns. Perfect for white-label.",
                author: "Michael Torres",
                role: "Founder",
                company: "GrowthLab Agency"
              },
              {
                quote: "The intent scoring and verification features are incredible. We're booking 3x more qualified demos because we're reaching the right people.",
                author: "Jessica Park",
                role: "VP Marketing",
                company: "CloudScale Inc"
              },
            ].map((item, i) => (
              <GlassPanel key={i} intensity="medium" className="p-6">
                <p className="text-sm text-[#EDEEF2] italic mb-4 leading-relaxed">
                  "{item.quote}"
                </p>
                <div className="border-t border-[#8B90A0]/20 pt-4">
                  <p className="text-sm font-bold text-[#EDEEF2]">{item.author}</p>
                  <p className="text-xs text-[#8B90A0]">{item.role}, {item.company}</p>
                </div>
              </GlassPanel>
            ))}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { stat: '10x', label: 'Faster lead discovery' },
              { stat: '98%', label: 'Data accuracy rate' },
              { stat: '3x', label: 'More qualified meetings' },
              { stat: '10M+', label: 'Leads generated' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#6E4AFF] to-[#4DE3FF] bg-clip-text text-transparent mb-2">
                  {item.stat}
                </div>
                <p className="text-sm text-[#8B90A0]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#EDEEF2] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-[#8B90A0]">
              Everything you need to know about LeadGenX
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is this scraped data?',
                a: 'No. We use AI-powered discovery across Google Maps, professional networks, public business directories, and verified APIs. All data is enriched in real-time via verified sources — never scraped or purchased lists.'
              },
              {
                q: 'How are leads verified?',
                a: 'All emails and phone numbers are verified in real-time using premium validation APIs. We check deliverability, catch-all detection, and phone number validity. 98%+ accuracy guaranteed.'
              },
              {
                q: 'Can I run campaigns by industry + geography?',
                a: 'Yes! Create unlimited campaigns targeting specific industries (e.g., "SaaS companies in San Francisco"), company sizes, job titles, and more. Full geo-targeting support.'
              },
              {
                q: 'Can my agency manage separate clients?',
                a: 'Absolutely. Our Growth and Enterprise plans support multi-client workspaces. Each client gets their own CRM, campaigns, leads, and billing. Perfect for agencies and consultants.'
              },
              {
                q: 'Can I integrate automation and outreach?',
                a: 'Yes. Export leads to CSV, push to CRM via webhook, or integrate with AutoGenX (our sister product) for end-to-end email/LinkedIn automation. Full API access included.'
              },
            ].map((item, i) => (
              <GlassPanel key={i} intensity="medium" className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left flex items-start justify-between gap-4 hover:bg-[#8B90A0]/5 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-[#EDEEF2] mb-1">{item.q}</h3>
                    {openFaq === i && (
                      <p className="text-sm text-[#8B90A0] mt-3 leading-relaxed">{item.a}</p>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[#8B90A0] flex-shrink-0 transition-transform ${
                    openFaq === i ? 'rotate-180' : ''
                  }`} />
                </button>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA - FIXED WIDTH */}
      <section className="relative w-full py-16 px-4">
        <div className="mx-auto w-full max-w-6xl">
          <GlassPanel intensity="strong" withGlow="purple" className="p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#EDEEF2] mb-4">
              Ready to Transform Your Lead Generation?
            </h2>
            <p className="text-lg text-[#8B90A0] mb-8 max-w-2xl mx-auto">
              Join hundreds of sales teams generating qualified pipeline with AI-powered lead discovery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/demo">
                <Button size="lg" className="w-full sm:w-auto min-w-[220px] shadow-[0_0_30px_rgba(110,74,255,0.4)]">
                  Get a Live Demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="glass" size="lg" className="w-full sm:w-auto min-w-[220px]">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <p className="text-sm text-[#8B90A0] mt-6">
              <CheckCircle2 className="w-4 h-4 inline mr-1 text-[#10B981]" />
              14-day free trial • No credit card required • Setup in 5 minutes
            </p>
          </GlassPanel>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-4 py-12 sm:px-6 lg:px-8 border-t border-[#8B90A0]/10">
        <div className="mx-auto max-w-7xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#EDEEF2]">LeadGenX</span>
          </div>
          <p className="text-sm text-[#8B90A0] mb-4">
            AI-powered lead generation for modern B2B teams
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-[#8B90A0] mb-4">
            <Link href="/pricing" className="hover:text-[#EDEEF2] transition-colors">Pricing</Link>
            <span>•</span>
            <Link href="/demo" className="hover:text-[#EDEEF2] transition-colors">Book Demo</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-[#EDEEF2] transition-colors">Sign In</Link>
            <span>•</span>
            <Link href="/register" className="hover:text-[#EDEEF2] transition-colors">Start Free Trial</Link>
          </div>
          <p className="text-xs text-[#8B90A0] mt-8">
            © 2025 LeadGenX. Built with AI by DeepAgent.
          </p>
        </div>
      </footer>

      {/* Genie AI Widget */}
      <GenieChatWidget />
    </div>
  );
}