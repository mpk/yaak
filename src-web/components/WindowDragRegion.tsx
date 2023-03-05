import classnames from 'classnames';
import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export function WindowDragRegion({ className, ...props }: Props) {
  return (
    <div
      data-tauri-drag-region
      className={classnames(className, 'w-full h-8 flex-shrink-0 box-content')}
      {...props}
    />
  );
}
