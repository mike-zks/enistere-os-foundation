/**
 * ErrorState — standard error placeholder with optional retry (spec §26).
 * Messages must stay safe to surface (no tokens / sensitive data).
 */
import { MessageState } from './MessageState';

export interface ErrorStateProps {
  readonly title?: string;
  readonly description?: string;
  readonly onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
}: ErrorStateProps): React.JSX.Element {
  return (
    <MessageState
      title={title}
      description={description}
      tone="danger"
      action={onRetry ? { label: 'Retry', onPress: onRetry } : undefined}
    />
  );
}
