/**
 * Design tokens and theme configuration for GR PitWall
 * Based on Toyota GR brand colors and racing aesthetics
 */

export const theme = {
  colors: {
    // GR Brand Colors
    grRed: '#7B1E2D',
    grRedLight: '#A02A3F',
    grRedDark: '#5A151F',
    
    // Status Colors
    critical: '#FF3B30',    // High tire wear, danger
    warning: '#FFB74D',     // Moderate wear, caution
    healthy: '#37D67A',     // Good condition
    info: '#4A90E2',        // Informational
    
    // Neutral Backgrounds
    background: '#FAFBFC',
    backgroundSecondary: '#F3F4F6',
    backgroundTertiary: '#E5E7EB',
    
    // Text Colors
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    // Track & UI
    trackLine: '#E6E6E6',
    trackLineActive: '#7B1E2D',
    carGlow: 'rgba(123, 30, 45, 0.3)',
    carGlowSelected: 'rgba(123, 30, 45, 0.6)',
    
    // Sector Colors (for heatmaps)
    sectorLow: '#37D67A',
    sectorMedium: '#FFB74D',
    sectorHigh: '#FF3B30',
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
} as const;

/**
 * Get tire wear color based on wear percentage
 */
export function getTireWearColor(wear: number): string {
  if (wear > 0.6) return theme.colors.critical;
  if (wear > 0.3) return theme.colors.warning;
  return theme.colors.healthy;
}

/**
 * Get tire wear opacity for glow effects
 */
export function getTireWearOpacity(wear: number): number {
  // More wear = more visible glow
  return Math.min(0.6, 0.2 + wear * 0.4);
}

/**
 * Get team/car color (fallback to GR red if not specified)
 */
export function getTeamColor(chassis: string, defaultColor?: string): string {
  // You can extend this with a mapping of chassis -> team colors
  return defaultColor || theme.colors.grRed;
}

