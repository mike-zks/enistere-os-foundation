/**
 * OfflineState — placeholder for "no connectivity" (spec §26 / §37).
 *
 * This is a presentational PLACEHOLDER only: actual connectivity detection
 * (e.g. expo-network / NetInfo) is out of the starter-foundation scope.
 */
import { MessageState } from './MessageState';

export interface OfflineStateProps {
  readonly onRetry?: () => void;
}

export function OfflineState({ onRetry }: OfflineStateProps): React.JSX.Element {
  return (
    <MessageState
      title="You're offline"
      description="Check your connection and try again."
      action={onRetry ? { label: 'Retry', onPress: onRetry, variant: 'secondary' } : undefined}
    />
  );
}
