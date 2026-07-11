import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { EmptyStateProps } from './empty-state.types.js';

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, description, action, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={mergeClassNames('enistere-empty-state', className)} {...rest}>
      <p className="enistere-empty-state__title">{title}</p>
      {description != null && <p className="enistere-empty-state__description">{description}</p>}
      {action != null && <div className="enistere-empty-state__action">{action}</div>}
    </div>
  );
});
