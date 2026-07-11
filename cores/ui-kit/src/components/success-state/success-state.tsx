import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { SuccessStateProps } from './success-state.types.js';

export const SuccessState = forwardRef<HTMLDivElement, SuccessStateProps>(function SuccessState(
  { title, message, action, className, role = 'status', ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={mergeClassNames('enistere-success-state', className)}
      role={role}
      {...rest}
    >
      <p className="enistere-success-state__title">{title}</p>
      {message != null && <p className="enistere-success-state__message">{message}</p>}
      {action != null && <div className="enistere-success-state__action">{action}</div>}
    </div>
  );
});
