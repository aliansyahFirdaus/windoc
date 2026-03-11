import { useState, useEffect, useRef } from 'react';
import { Table } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function TableTool() {
  const { editorRef } = useEditor();
  const [visible, setVisible] = useState(false);
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setVisible(false);
        setHoverRow(0);
        setHoverCol(0);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible]);

  const handleInsertTable = () => {
    if (hoverRow > 0 && hoverCol > 0) {
      editorRef.current?.command.executeInsertTable(hoverRow, hoverCol);
    }
    setVisible(false);
    setHoverRow(0);
    setHoverCol(0);
  };

  return (
    <div ref={containerRef} className="menu-item__table" title="Table">
      <Table
        size={16}
        onClick={() => setVisible(!visible)}
        style={{ cursor: 'pointer' }}
      />
      {visible && (
        <div className="table-dropdown">
          <div className="table-dropdown-header">
            <span>
              {hoverRow > 0 ? `${hoverRow} × ${hoverCol}` : 'Insert Table'}
            </span>
          </div>
          <div className="table-dropdown-grid" onClick={handleInsertTable}>
            {Array.from({ length: 8 }).map((_, rowIdx) => (
              <div key={rowIdx} className="table-dropdown-row">
                {Array.from({ length: 8 }).map((_, colIdx) => (
                  <div
                    key={colIdx}
                    className={`table-dropdown-cell ${rowIdx < hoverRow && colIdx < hoverCol ? 'active' : ''}`}
                    onMouseEnter={() => {
                      setHoverRow(rowIdx + 1);
                      setHoverCol(colIdx + 1);
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
