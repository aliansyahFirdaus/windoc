import { useState, useRef, useEffect, CSSProperties } from 'react';

interface DropdownPosition {
  top: number;
  left?: number;
  right?: number;
}

export function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    right: undefined
  });
  const triggerRef = useRef<HTMLDivElement>(null);

  const open = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 2, left: rect.left, right: undefined });
      setIsOpen(true);
      requestAnimationFrame(() => {
        const portal = document.querySelector<HTMLElement>('.menu-item-portal');
        if (!portal) return;
        const portalRect = portal.getBoundingClientRect();
        if (portalRect.right > window.innerWidth) {
          setPosition({
            top: rect.bottom + 2,
            left: undefined,
            right: window.innerWidth - rect.right
          });
        }
      });
    } else {
      setIsOpen(true);
    }
  };

  const close = () => setIsOpen(false);

  const toggle = () => (isOpen ? close() : open());

  const portalStyle: CSSProperties = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    right: position.right,
    zIndex: 9999
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return { triggerRef, isOpen, toggle, open, close, portalStyle };
}
