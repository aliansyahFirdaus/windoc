import { createPortal } from 'react-dom';
import { CSSProperties, ReactNode } from 'react';

interface DropdownPortalProps {
  isOpen: boolean;
  style: CSSProperties;
  className?: string;
  wrapperClassName?: string;
  children: ReactNode;
}

export default function DropdownPortal({
  isOpen,
  style,
  className,
  wrapperClassName,
  children
}: DropdownPortalProps) {
  if (!isOpen) return null;
  return createPortal(
    <div
      className={`menu-item menu-item-portal${wrapperClassName ? ` ${wrapperClassName}` : ''}`}
      style={style}
    >
      <div className={className}>{children}</div>
    </div>,
    document.body
  );
}
