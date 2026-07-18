import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { ErrorStateProps } from './error-state.types.js';

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(function ErrorState(
  { title, message, action, className, role = 'alert', ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={mergeClassNames('enistere-error-state', className)}
      role={role}
      {...rest}
    >
      <p className="enistere-error-state__title">{title}</p>
      {message != null && <p className="enistere-error-state__message">{message}</p>}
      {action != null && <div className="enistere-error-state__action">{action}</div>}
    </div>
  );
});
