/**
 * Couleurs PRIMITIVES (valeurs brutes, agnostiques, sans intention d'usage). Hex `#RRGGBB`.
 * Palette neutre + marque générique + échelles de statut. AUCUNE identité projet imposée.
 * Les composants n'utilisent PAS ces primitives directement : ils passent par les couleurs sémantiques.
 */
import type { ColorPrimitives } from '../contracts.js';

export const colors = {
  neutral: {
    '0': '#FFFFFF',
    '50': '#F8FAFC',
    '100': '#F1F5F9',
    '200': '#E2E8F0',
    '300': '#CBD5E1',
    '400': '#94A3B8',
    '500': '#64748B',
    '600': '#475569',
    '700': '#334155',
    '800': '#1E293B',
    '900': '#0F172A',
    '950': '#020617',
  },
  brand: {
    '50': '#EFF6FF',
    '100': '#DBEAFE',
    '200': '#BFDBFE',
    '300': '#93C5FD',
    '400': '#60A5FA',
    '500': '#3B82F6',
    '600': '#2563EB',
    '700': '#1D4ED8',
    '800': '#1E40AF',
    '900': '#1E3A8A',
    '950': '#172554',
  },
  red: {
    '50': '#FEF2F2',
    '100': '#FEE2E2',
    '500': '#EF4444',
    '600': '#DC2626',
    '700': '#B91C1C',
    '900': '#7F1D1D',
  },
  green: {
    '50': '#F0FDF4',
    '100': '#DCFCE7',
    '500': '#22C55E',
    '600': '#16A34A',
    '700': '#15803D',
    '900': '#14532D',
  },
  amber: {
    '50': '#FFFBEB',
    '100': '#FEF3C7',
    '500': '#F59E0B',
    '600': '#D97706',
    '700': '#B45309',
    '900': '#78350F',
  },
  blue: {
    '50': '#EFF6FF',
    '100': '#DBEAFE',
    '500': '#3B82F6',
    '600': '#2563EB',
    '700': '#1D4ED8',
    '900': '#1E3A8A',
  },
} satisfies ColorPrimitives;
