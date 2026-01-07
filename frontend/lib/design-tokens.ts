/**
 * LeadGenX Enterprise Glass UI Design Tokens
 * 
 * Centralized design system tokens for consistent styling across
 * web dashboard, iOS, and Android platforms.
 */

export const colors = {
  // Primary - Royal Purple
  primary: {
    royal: '#6E4AFF',
    deep: '#3A1C78',
    light: '#9370FF',
  },
  
  // Accent - Cyan Glow
  accent: {
    cyan: '#4DE3FF',
    teal: '#2FFFD5',
    cyanMuted: '#3BB5D0',
  },
  
  // Base - Dark Slate
  base: {
    slateBlack: '#0B0E14',
    graphite: '#141824',
    graphiteLight: '#1A1F2E',
    softGray: '#8B90A0',
    offWhite: '#EDEEF2',
  },
  
  // Semantic
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    dangerMuted: '#7F1D1D',
  },
  
  // Glass System
  glass: {
    bgLight: 'rgba(255, 255, 255, 0.08)',
    bgMedium: 'rgba(255, 255, 255, 0.12)',
    bgStrong: 'rgba(255, 255, 255, 0.16)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderMuted: 'rgba(255, 255, 255, 0.08)',
  },
  
  // Glow System
  glow: {
    purple: 'rgba(110, 74, 255, 0.3)',
    cyan: 'rgba(77, 227, 255, 0.3)',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    heading: "'Space Grotesk', 'Inter', sans-serif",
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.025em',
  },
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const;

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
  glowPurple: '0 0 20px rgba(110, 74, 255, 0.3)',
  glowCyan: '0 0 20px rgba(77, 227, 255, 0.3)',
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },
  
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const blur = {
  glass: '12px',
  glassStrong: '20px',
  glow: '16px',
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
} as const;

export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Animation = typeof animation;
export type Blur = typeof blur;
export type Breakpoints = typeof breakpoints;
export type ZIndex = typeof zIndex;