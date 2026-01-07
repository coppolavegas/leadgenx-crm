# LeadGenX Glass UI - Quick Reference

## 🎨 Colors
```typescript
// Primary
#6E4AFF - Royal Purple
#3A1C78 - Deep Violet

// Accent
#4DE3FF - Cyan Glow
#2FFFD5 - Electric Teal

// Base
#0B0E14 - Slate Black
#141824 - Graphite
#8B90A0 - Soft Gray
#EDEEF2 - Off White
```

## 🔘 Buttons
```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="glass">Glass</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

## 🏷️ Badges
```tsx
<Badge variant="verified">Verified</Badge>
<Badge variant="preference">Preference</Badge>
<Badge variant="excluded">Excluded</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="primary">Primary</Badge>
```

## 🃏 Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

## 📊 Confidence Indicator
```tsx
<ConfidenceIndicator 
  score={85} 
  size="sm|md|lg" 
  showLabel={true}
/>
```

## 🎭 Glass Panel
```tsx
<GlassPanel 
  intensity="light|medium|strong"
  withBorder={true}
  withGlow="purple|cyan|none"
>
  Content
</GlassPanel>
```

## ✨ Utility Classes
```css
/* Glass Effects */
.glass
.glass-medium
.glass-strong

/* Glows */
.glow-purple
.glow-cyan
.glow-purple-sm
.glow-cyan-sm

/* Gradients */
.gradient-purple
.gradient-cyan
.gradient-purple-cyan

/* Text Gradients */
.text-gradient-purple
.text-gradient-cyan
.heading-gradient

/* Interactions */
.hover-lift
.press-effect
```

## 🎬 Animations
```css
/* Pulse Glows */
.animate-pulse-glow-purple
.animate-pulse-glow-cyan
```

## 📐 Spacing
```typescript
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

## 🔲 Radius
```typescript
sm: 8px
md: 12px
lg: 16px
xl: 20px
full: 9999px
```

## 📝 Typography
```css
/* Fonts */
font-sans: Inter
font-heading: Space Grotesk

/* Sizes */
text-xs: 12px
text-sm: 14px
text-base: 16px
text-lg: 18px
text-xl: 20px
text-2xl: 24px
text-3xl: 30px
text-4xl: 36px
```

## 🎯 Common Patterns

### Hero Gradient Title
```tsx
<h1>
  <span className="text-[#EDEEF2]">LeadGenX</span>
  <span className="bg-gradient-to-r from-[#6E4AFF] to-[#4DE3FF] bg-clip-text text-transparent">
    Intelligent Platform
  </span>
</h1>
```

### Icon Button with Glow
```tsx
<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6E4AFF] to-[#3A1C78] 
                shadow-[0_0_20px_rgba(110,74,255,0.3)] 
                group-hover:shadow-[0_0_30px_rgba(110,74,255,0.5)]">
  <Icon className="w-6 h-6 text-white" />
</div>
```

### Ambient Background
```tsx
<div className="fixed inset-0 pointer-events-none">
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E4AFF] rounded-full blur-[128px] opacity-20 animate-pulse" />
  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4DE3FF] rounded-full blur-[128px] opacity-20 animate-pulse" />
</div>
```

## ♿ Accessibility
- All interactive elements have focus states
- Minimum touch target: 44x44px
- WCAG AA contrast compliant
- Respects `prefers-reduced-motion`

---

**Quick Tip:** Use purple for authority/brand, cyan for actions/highlights. Keep glows subtle (≤30% opacity).
