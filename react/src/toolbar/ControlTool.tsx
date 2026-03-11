import { useRef } from 'react';

export default function ControlTool() {
  const optionsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="menu-item__control"
      onClick={() => optionsRef.current?.classList.toggle('visible')}
    >
      <i title="Control"></i>
      <div className="options" ref={optionsRef}>
        <ul>
          <li>Text</li>
          <li>Number</li>
          <li>Select</li>
          <li>Date</li>
          <li>Checkbox</li>
          <li>Radio</li>
        </ul>
      </div>
    </div>
  );
}
