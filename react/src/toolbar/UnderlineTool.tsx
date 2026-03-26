import { useRef } from 'react';
import { Underline as UnderlineIcon, ChevronDown } from 'lucide-react';
import { useEditor } from '../EditorContext';

const STYLES = ['solid', 'double', 'dashed', 'dotted', 'wavy'];

export default function UnderlineTool() {
  const { editorRef, isApple, rangeStyle } = useEditor();
  const optionsRef = useRef<HTMLDivElement>(null);
  const isActive = rangeStyle?.underline === true;

  return (
    <div className="menu-item__underline-group">
      <div
        className={`menu-item__underline-btn${isActive ? ' active' : ''}`}
        title={`Underline(${isApple ? '⌘' : 'Ctrl'}+U)`}
        onClick={() => editorRef.current?.command.executeUnderline()}
      >
        <UnderlineIcon size={16} />
      </div>
      <div
        className="menu-item__underline-arrow"
        onClick={() => optionsRef.current?.classList.toggle('visible')}
      >
        <ChevronDown size={10} strokeWidth={2.5} />
        <div className="options" ref={optionsRef}>
          <ul>
            {STYLES.map(style => (
              <li
                key={style}
                data-decoration-style={style}
                onClick={e => {
                  e.stopPropagation();
                  editorRef.current?.command.executeUnderline({ style });
                  optionsRef.current?.classList.remove('visible');
                }}
              >
                <i></i>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
