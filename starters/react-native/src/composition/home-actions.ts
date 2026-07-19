import type { Href } from 'expo-router';

export interface CapabilityHomeAction {
  readonly href: Href;
  readonly label: string;
  readonly order: number;
}

/** Empty baseline registry; capability overlays contribute protected Home actions. */
export const CAPABILITY_HOME_ACTIONS: readonly CapabilityHomeAction[] = [];
