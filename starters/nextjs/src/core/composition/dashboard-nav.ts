// Empty baseline registry. The Factory renders selected capability links here.
export interface CapabilityDashboardLink {
  readonly href: string;
  readonly label: string;
  readonly order: number;
}

export const CAPABILITY_DASHBOARD_LINKS: readonly CapabilityDashboardLink[] = [];
