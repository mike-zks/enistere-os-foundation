/**
 * Standard UI states (spec §26). Generic and UI-Kit-compatible.
 *
 * RN35: `*View` aliases added so consumers can use either naming convention
 * (LoadingState/LoadingView, EmptyState/EmptyView, ErrorState/ErrorView).
 */
export { LoadingState } from './LoadingState';
export type { LoadingStateProps } from './LoadingState';
export { ErrorState } from './ErrorState';
export type { ErrorStateProps } from './ErrorState';
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
export { OfflineState } from './OfflineState';
export type { OfflineStateProps } from './OfflineState';
export { UnauthorizedState } from './UnauthorizedState';
export type { UnauthorizedStateProps } from './UnauthorizedState';
export { MessageState } from './MessageState';
export type { MessageStateProps, MessageStateAction } from './MessageState';

// RN35 — view aliases (mirror of the *State exports above)
export { LoadingState as LoadingView } from './LoadingState';
export { EmptyState as EmptyView } from './EmptyState';
export { ErrorState as ErrorView } from './ErrorState';
