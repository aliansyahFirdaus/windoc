import { useRef, useState } from 'react';
import { useEditor } from '../EditorContext';

export default function ColumnTool() {
  const { editorRef } = useEditor();
  const optionsRef = useRef<HTMLDivElement>(null);
  const [currentColumns, setCurrentColumns] = useState(1);
  const [gap, setGap] = useState(20);

  const handleColumn = (col: number) => {
    editorRef.current?.command.executeColumnCount(col);
    setCurrentColumns(col);
  };

  const handleGapChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    setGap(clampedValue);
    editorRef.current?.command.executeColumnGap(clampedValue);
  };

  return (
    <div
      className="menu-item__column"
      onClick={() => optionsRef.current?.classList.toggle('visible')}
    >
      <span className="select" title="Column Layout">
        {currentColumns === 1 ? '1 Column' : `${currentColumns} Columns`}
      </span>
      <div className="options" ref={optionsRef}>
        <div onClick={e => e.stopPropagation()}>
          <ul>
            <li onClick={() => handleColumn(1)}>1 Column</li>
            <li onClick={() => handleColumn(2)}>2 Columns</li>
          </ul>
          {currentColumns > 1 && (
            <>
              <div className="option-divider" />
              <div className="option-row">
                <label>Gap (px)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gap}
                  onChange={e => handleGapChange(Number(e.target.value))}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
