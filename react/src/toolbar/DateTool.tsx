import { useRef } from 'react';

export default function DateTool() {
  const optionsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="menu-item__date"
      onClick={() => optionsRef.current?.classList.toggle('visible')}
    >
      <i title="Date"></i>
      <div className="options" ref={optionsRef}>
        <ul>
          <li data-format="yyyy-MM-dd" suppressHydrationWarning>
            {new Date().toISOString().split('T')[0]}
          </li>
          <li data-format="yyyy-MM-dd hh:mm:ss" suppressHydrationWarning>
            {new Date().toISOString().replace('T', ' ').slice(0, 19)}
          </li>
        </ul>
      </div>
    </div>
  );
}
