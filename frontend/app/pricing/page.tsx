"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { CheckCircle2, Sparkles, ArrowRight, Users, Building2, Zap } from "lucide-react";
import Link from "next/link";
import { GenieChatWidget } from "@/components/genie-chat-widget";

export default function PricingPage() {
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
            <Link href="/demo">
              <Button variant="glass">Book Demo</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4">
              <Zap className="w-3 h-3" />
              Transparent Pricing
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#EDEEF2] mb-4">
              Choose the Right Plan for Your Business
            </h1>
            <p className="text-lg text-[#8B90A0] max-w-2xl mx-auto">
              From solo entrepreneurs to enterprise agencies. All plans include 14-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                name: 'Starter',
                icon: Users,
                price: '$99',
                period: '/month',
                description: 'Perfect for solo entrepreneurs',
                features: [
                  '500 leads/month',
                  'Single workspace',
                  'Email + phone enrichment',
                  'Basic CRM',
                  'Email support',
                  'Standard API access',
                ],
                cta: 'Start Free Trial',
                href: '/register?plan=starter',
                variant: 'glass' as const,
              },
              {
                name: 'Growth',
                icon: Building2,
                price: '$299',
                period: '/month',
                description: 'For growing sales teams',
                features: [
                  '2,500 leads/month',
                  'Multi-workspace support',
                  'Advanced enrichment',
                  'Full CRM + automation',
                  'Priority support',
                  'Dedicated account manager',
                ],
                cta: 'Start Free Trial',
                href: '/register?plan=growth',
                variant: 'default' as const,
                highlighted: true,
              },
              {
                name: 'Enterprise',
                icon: Sparkles,
                price: 'Custom',
                period: '',
                description: 'For agencies & enterprises',
                features: [
                  'Unlimited leads',
                  'Multi-client management',
                  'Custom integrations',
                  'White-label options',
                  'White-glove onboarding',
                  'SLA & compliance support',
                ],
                cta: 'Book a Demo',
                href: '/demo',
                variant: 'glass' as const,
              },
            ].map((plan, i) => {
              const Icon = plan.icon;
              return (
                <GlassPanel 
                  key={i} 
                  intensity={plan.highlighted ? 'strong' : 'medium'}
                  withGlow={plan.highlighted ? 'purple' : undefined}
                  className={`p-8 relative flex flex-col ${
                    plan.highlighted ? 'scale-105 border-2 border-[#6E4AFF] shadow-[0_0_40px_rgba(110,74,255,0.3)]' : ''
                  }`}
                >
                  {plan.highlighted && (
                    <Badge variant="primary" className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#4DE3FF] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(110,74,255,0.3)]">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#EDEEF2] mb-2">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-[#EDEEF2]">{plan.price}</span>
                      <span className="text-[#8B90A0]">{plan.period}</span>
                    </div>
                    <p className="text-sm text-[#8B90A0]">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-[#EDEEF2]">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#10B981] flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href}>
                    <Button 
                      variant={plan.variant} 
                      size="lg" 
                      className="w-full"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </GlassPanel>
              );
            })}
          </div>

          <p className="text-center text-sm text-[#8B90A0] mt-8 mb-16">
            All plans include 14-day free trial • No credit card required • Cancel anytime
          </p>

          {/* Compare Plans Section */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[#EDEEF2] mb-8 text-center">Compare All Features</h3>
            <GlassPanel intensity="medium" className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#8B90A0]/20">
                    <th className="text-left p-4 text-[#EDEEF2] font-semibold">Feature</th>
                    <th className="text-center p-4 text-[#EDEEF2] font-semibold">Starter</th>
                    <th className="text-center p-4 text-[#EDEEF2] font-semibold">Growth</th>
                    <th className="text-center p-4 text-[#EDEEF2] font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Leads per month', starter: '500', growth: '2,500', enterprise: 'Unlimited' },
                    { feature: 'Workspaces', starter: '1', growth: '5', enterprise: 'Unlimited' },
                    { feature: 'Email enrichment', starter: '✓', growth: '✓', enterprise: '✓' },
                    { feature: 'Phone enrichment', starter: '✓', growth: '✓', enterprise: '✓' },
                    { feature: 'Real-time verification', starter: '✓', growth: '✓', enterprise: '✓' },
                    { feature: 'Basic CRM', starter: '✓', growth: '✓', enterprise: '✓' },
                    { feature: 'Advanced CRM + Automation', starter: '—', growth: '✓', enterprise: '✓' },
                    { feature: 'Multi-client management', starter: '—', growth: '✓', enterprise: '✓' },
                    { feature: 'API access', starter: 'Standard', growth: 'Priority', enterprise: 'White-label' },
                    { feature: 'Custom integrations', starter: '—', growth: '—', enterprise: '✓' },
                    { feature: 'White-glove onboarding', starter: '—', growth: '—', enterprise: '✓' },
                    { feature: 'Dedicated account manager', starter: '—', growth: '✓', enterprise: '✓' },
                    { feature: 'SLA & compliance support', starter: '—', growth: '—', enterprise: '✓' },
                    { feature: 'Support', starter: 'Email', growth: 'Priority', enterprise: '24/7 Phone' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-[#8B90A0]/10 hover:bg-[#8B90A0]/5">
                      <td className="p-4 text-[#EDEEF2]">{row.feature}</td>
                      <td className="p-4 text-center text-[#8B90A0]">{row.starter}</td>
                      <td className="p-4 text-center text-[#8B90A0]">{row.growth}</td>
                      <td className="p-4 text-center text-[#8B90A0]">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassPanel>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[#EDEEF2] mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Can I change plans later?',
                  a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately with prorated billing.'
                },
                {
                  q: 'What happens after the free trial?',
                  a: 'Your card is charged automatically. No surprises — you\'ll receive reminder emails before billing.'
                },
                {
                  q: 'Do you offer annual billing?',
                  a: 'Yes! Annual plans save 20%. Contact us for details or book a demo.'
                },
                {
                  q: 'Can agencies manage multiple clients?',
                  a: 'Growth and Enterprise plans support multi-client workspaces with separate CRMs per client.'
                },
              ].map((item, i) => (
                <GlassPanel key={i} intensity="medium" className="p-6">
                  <h3 className="text-base font-bold text-[#EDEEF2] mb-2">{item.q}</h3>
                  <p className="text-sm text-[#8B90A0]">{item.a}</p>
                </GlassPanel>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative w-full py-16 px-4">
        <div className="mx-auto w-full max-w-6xl">
          <GlassPanel intensity="strong" withGlow="purple" className="p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#EDEEF2] mb-4">
              Ready to Transform Your Lead Generation?
            </h2>
            <p className="text-lg text-[#8B90A0] mb-8 max-w-2xl mx-auto">
              Start your 14-day free trial today or schedule a personalized demo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/demo">
                <Button size="lg" className="min-w-[200px] shadow-[0_0_30px_rgba(110,74,255,0.4)]">
                  Book a Demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="glass" size="lg" className="min-w-[200px]">
                  Start Free Trial
                </Button>
              </Link>
            </div>
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
          <div className="flex items-center justify-center gap-6 text-sm text-[#8B90A0] mb-4">
            <Link href="/" className="hover:text-[#EDEEF2] transition-colors">Home</Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-[#EDEEF2] transition-colors">Pricing</Link>
            <span>•</span>
            <Link href="/demo" className="hover:text-[#EDEEF2] transition-colors">Demo</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-[#EDEEF2] transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-[#8B90A0]">
            © 2025 LeadGenX. Built with AI by DeepAgent.
          </p>
        </div>
      </footer>

      {/* Genie AI Widget */}
      <GenieChatWidget />
    </div>
  );
}