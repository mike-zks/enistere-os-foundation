/**
 * EmptyState — standard "no content" placeholder (spec §26).
 */
import { MessageState } from './MessageState';

export interface EmptyStateProps {
  readonly title?: string;
  readonly description?: string;
  readonly action?: { readonly label: string; readonly onPress: () => void };
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <MessageState
      title={title}
      description={description}
      action={action ? { label: action.label, onPress: action.onPress, variant: 'secondary' } : undefined}
    />
  );
}
