import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useEditor } from '../EditorContext';

const FONTS = [
  { family: 'Arial', label: 'Arial' },
  { family: 'Times New Roman', label: 'Times New Roman' },
  { family: 'Georgia', label: 'Georgia' },
  { family: 'Verdana', label: 'Verdana' },
  { family: 'Trebuchet MS', label: 'Trebuchet MS' },
  { family: 'Courier New', label: 'Courier New' },
  { family: 'Comic Sans MS', label: 'Comic Sans MS' },
  { family: 'Impact', label: 'Impact' }
];

export default function FontTool() {
  const { editorRef, rangeStyle } = useEditor();
  const optionsRef = useRef<HTMLDivElement>(null);

  const activeFont = rangeStyle?.font || 'Arial';
  const activeLabel =
    FONTS.find(f => f.family === activeFont)?.label || activeFont;

  const toggle = () => optionsRef.current?.classList.toggle('visible');
  const close = () => optionsRef.current?.classList.remove('visible');

  return (
    <div className="menu-item__select-group">
      <div className="menu-item__select-text" title="Font">
        {activeLabel}
      </div>
      <div className="menu-item__select-arrow" onClick={toggle}>
        <ChevronDown size={10} strokeWidth={2.5} />
        <div className="options" ref={optionsRef} style={{ width: '150px' }}>
          <ul>
            {FONTS.map(({ family, label }) => (
              <li
                key={family}
                data-family={family}
                className={activeFont === family ? 'active' : ''}
                style={{ fontFamily: family }}
                onClick={e => {
                  e.stopPropagation();
                  editorRef.current?.command.executeFont(family);
                  close();
                }}
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
