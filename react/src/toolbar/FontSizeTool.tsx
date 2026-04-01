import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useEditor } from '../EditorContext';

const SIZES = [72, 48, 36, 24, 20, 18, 16, 14, 12, 11, 10, 9, 8, 7];

export default function FontSizeTool() {
  const { editorRef, rangeStyle } = useEditor();
  const optionsRef = useRef<HTMLDivElement>(null);

  const activeSize = rangeStyle?.size ?? 11;

  const toggle = () => optionsRef.current?.classList.toggle('visible');
  const close = () => optionsRef.current?.classList.remove('visible');

  return (
    <div className="menu-item__select-group">
      <div className="menu-item__select-text" title="Font Size">
        {activeSize}
      </div>
      <div className="menu-item__select-arrow" onClick={toggle}>
        <ChevronDown size={10} strokeWidth={2.5} />
        <div className="options" ref={optionsRef} style={{ width: '60px' }}>
          <ul>
            {SIZES.map(size => (
              <li
                key={size}
                className={activeSize === size ? 'active' : ''}
                onClick={e => {
                  e.stopPropagation();
                  editorRef.current?.command.executeSize(size);
                  close();
                }}
              >
                {size}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
