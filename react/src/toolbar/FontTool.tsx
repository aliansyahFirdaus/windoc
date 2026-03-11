import { useRef } from 'react';
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

  const handleFont = (family: string) => {
    editorRef.current?.command.executeFont(family);
  };

  return (
    <div
      className="menu-item__font"
      onClick={() => optionsRef.current?.classList.toggle('visible')}
    >
      <span className="select" title="Font">
        {activeLabel}
      </span>
      <div className="options" ref={optionsRef}>
        <ul>
          {FONTS.map(({ family, label }) => (
            <li
              key={family}
              data-family={family}
              className={activeFont === family ? 'active' : ''}
              style={{ fontFamily: family }}
              onClick={() => handleFont(family)}
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
