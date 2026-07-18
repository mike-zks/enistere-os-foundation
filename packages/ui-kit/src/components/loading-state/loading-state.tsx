import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import { Spinner } from '../spinner/spinner.js';
import type { LoadingStateProps } from './loading-state.types.js';

export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(function LoadingState(
  { message, size = 'md', className, role = 'status', ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={mergeClassNames('enistere-loading-state', className)}
      role={role}
      {...rest}
    >
      <Spinner size={size} decorative />
      {message != null && <p className="enistere-loading-state__message">{message}</p>}
    </div>
  );
});
