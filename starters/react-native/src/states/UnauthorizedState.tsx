/**
 * UnauthorizedState — placeholder for expired/invalid session (spec §26, §17).
 * Shown when a 401/403 indicates the session should be re-established.
 */
import { MessageState } from './MessageState';

export interface UnauthorizedStateProps {
  readonly onSignIn?: () => void;
}

export function UnauthorizedState({ onSignIn }: UnauthorizedStateProps): React.JSX.Element {
  return (
    <MessageState
      title="Session expired"
      description="Your session is no longer valid. Please sign in again."
      action={onSignIn ? { label: 'Sign in', onPress: onSignIn } : undefined}
    />
  );
}
