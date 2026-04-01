import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useEditor } from '../EditorContext';

const LINE_HEIGHTS = ['1.0', '1.15', '1.5', '2.0', '2.5'];

export default function LineHeightTool() {
  const { editorRef, rangeStyle } = useEditor();
  const optionsRef = useRef<HTMLDivElement>(null);

  const activeMargin = rangeStyle?.rowMargin ?? 1;
  const activeLabel = Number.isInteger(activeMargin)
    ? `${activeMargin}.0`
    : String(activeMargin);

  const toggle = () => optionsRef.current?.classList.toggle('visible');
  const close = () => optionsRef.current?.classList.remove('visible');

  return (
    <div className="menu-item__select-group">
      <div className="menu-item__select-text" title="Line Height">
        {activeLabel}
      </div>
      <div className="menu-item__select-arrow" onClick={toggle}>
        <ChevronDown size={10} strokeWidth={2.5} />
        <div className="options" ref={optionsRef} style={{ width: '60px' }}>
          <ul>
            {LINE_HEIGHTS.map(h => (
              <li
                key={h}
                className={
                  String(activeMargin) === h || activeLabel === h ? 'active' : ''
                }
                onClick={e => {
                  e.stopPropagation();
                  editorRef.current?.command.executeRowMargin(Number(h));
                  close();
                }}
              >
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
