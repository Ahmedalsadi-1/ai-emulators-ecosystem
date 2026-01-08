/**
 * KRONOS-OS DESIGN TOKENS - EXPORT FOR AGENTS 2, 3, 4
 * 
 * This file exports all theme variables for use across components.
 * Import these tokens in your React components to ensure consistency.
 * 
 * COLOR PALETTE
 * - Obsidian base: #0A0A0A (deep black)
 * - Glass panels: rgba(10, 10, 10, 0.9) (90% transparent)
 * - Borders: rgba(255, 255, 255, 0.1) (10% white)
 * - Status green: rgba(74, 222, 128, 0.5) (subtle)
 * 
 * TYPOGRAPHY
 * - Primary: #F5F5F5 (bright silver)
 * - Secondary: #E5E7EB (medium silver)
 * - High contrast ensured for dark theme
 * 
 * BORDER RULES (CRITICAL)
 * - ALL borders must be 1px solid
 * - NO thick borders (border-2, border-3, border-4)
 * - NO glowing borders (glow-, shadow-[xl|2xl|3xl], ring-[2-9])
 * - NO bright colors (bright-[500-900])
 * 
 * GLASSMORPHISM
 * - Background: rgba(10, 10, 10, 0.9)
 * - Blur: 20px
 * - Border: 1px solid rgba(255, 255, 255, 0.1)
 * - Shadow: 0 4px 16px rgba(0, 0, 0, 0.4)
 */

export const KRONOS_THEME = {
  // Colors
  obsidian: '#0A0A0A',
  glass: 'rgba(10, 10, 10, 0.9)',
  border: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#F5F5F5',
  textSecondary: '#E5E7EB',
  statusGreen: 'rgba(74, 222, 128, 0.5)',
  
  // Glassmorphism
  glassBlur: '20px',
  glassShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  
  // Borders
  borderWidth: '1px',
  
  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, Inter, SF Pro Display, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif',
  
  // Border Radius
  radiusSm: '10px',
  radiusMd: '16px',
  radiusLg: '24px',
} as const;

export type KronosTheme = typeof KRONOS_THEME;

/**
 * Tailwind utility class recommendations for KRONOS-OS components:
 * 
 * PANELS:
 * - bg-kronos-glass
 * - backdrop-blur-glass
 * - border-glass
 * - shadow-glass-md
 * 
 * BUTTONS (Primary):
 * - bg-white
 * - text-kronos-obsidian
 * - border-glass
 * - hover:translate-y-[-1px]
 * 
 * BUTTONS (Secondary):
 * - bg-kronos-glass
 * - backdrop-blur-glass
 * - border-glass
 * - hover:bg-opacity-95
 * 
 * TEXT:
 * - text-kronos-text-primary (headings)
 * - text-kronos-text-secondary (body)
 * 
 * STATUS:
 * - text-kronos-status-green (success indicators)
 */
