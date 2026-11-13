import userConfig from '../../pbnj.config.js';
import { getTheme, defaultTheme, type Theme, type ThemeColors } from './themes';

export interface FooterConfig {
  text: string;
  link?: string;
}

export interface PbnjConfig {
  name: string;
  logo: string;
  idStyle: 'sandwich' | 'short' | 'uuid';
  homepage: boolean;
  maxPasteSize: string;
  theme: string;
  sortOrder: 'newest' | 'oldest';
  footer?: FooterConfig;
}

const defaults: PbnjConfig = {
  name: 'pbnj',
  logo: '/logo.png',
  idStyle: 'sandwich',
  homepage: true,
  maxPasteSize: '1mb',
  theme: defaultTheme,
  sortOrder: 'newest',
  footer: {
    text: 'spread the code 🥪',
    link: 'https://github.com/SamarV-121/pbnj',
  },
};

export const config: PbnjConfig = {
  ...defaults,
  ...userConfig,
};

// Get the resolved theme object
export const theme: Theme = getTheme(config.theme);

// Export theme colors for easy access
export const colors: ThemeColors = theme.colors;

/**
 * Parse size string to bytes
 * @param size - Size string like '1mb', '500kb'
 * @returns Size in bytes
 */
export function parseSize(size: string): number {
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 1024 * 1024; // Default 1mb

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  return Math.floor(value * multipliers[unit]);
}

/**
 * Parse expiry duration to milliseconds
 * @param duration - Duration string like '10m', '1h', '1d', '1w'
 * @returns Duration in milliseconds, or null if invalid
 */
export function parseDuration(duration: string): number | null {
  const match = duration.toLowerCase().match(/^(\d+)([smhdw])$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  const ms = value * multipliers[match[2]];
  return value > 0 && Number.isSafeInteger(ms) ? ms : null;
}

export default config;
