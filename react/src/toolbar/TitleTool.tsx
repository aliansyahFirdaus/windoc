import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useEditor } from '../EditorContext';

const LEVELS: { level: string | null; label: string }[] = [
  { level: null, label: 'Body' },
  { level: 'first', label: 'Heading 1' },
  { level: 'second', label: 'Heading 2' },
  { level: 'third', label: 'Heading 3' },
  { level: 'fourth', label: 'Heading 4' },
  { level: 'fifth', label: 'Heading 5' },
  { level: 'sixth', label: 'Heading 6' }
];

export default function TitleTool() {
  const { editorRef, rangeStyle } = useEditor();
  const optionsRef = useRef<HTMLDivElement>(null);

  const activeLevel = rangeStyle?.level || null;
  const activeLabel =
    LEVELS.find(l => l.level === activeLevel)?.label || 'Body';

  const toggle = () => optionsRef.current?.classList.toggle('visible');
  const close = () => optionsRef.current?.classList.remove('visible');

  return (
    <div className="menu-item__select-group">
      <div className="menu-item__select-text" title="Toggle Heading">
        {activeLabel}
      </div>
      <div className="menu-item__select-arrow" onClick={toggle}>
        <ChevronDown size={10} strokeWidth={2.5} />
        <div className="options" ref={optionsRef} style={{ width: '100px' }}>
          <ul>
            {LEVELS.map(({ level, label }) => (
              <li
                key={label}
                className={activeLevel === level ? 'active' : ''}
                {...(level ? { 'data-level': level } : {})}
                onClick={e => {
                  e.stopPropagation();
                  editorRef.current?.command.executeTitle(level);
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
