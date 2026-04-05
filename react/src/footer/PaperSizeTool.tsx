import { useState } from 'react';
import { useEditor } from '../EditorContext';
import { useFooter } from '../FooterContext';

const SIZES = [
  { label: 'A4', width: 794, height: 1123 },
  { label: 'A2', width: 1593, height: 2251 },
  { label: 'A3', width: 1125, height: 1593 },
  { label: 'A5', width: 565, height: 796 }
];

export default function PaperSizeTool() {
  const { editorRef } = useEditor();
  const { paperWidth, paperHeight, setPaperWidth, setPaperHeight } = useFooter();
  const [visible, setVisible] = useState(false);

  const handlePaperSize = (width: number, height: number) => {
    editorRef.current?.command.executePaperSize(width, height);
    setPaperWidth(width);
    setPaperHeight(height);
    setVisible(false);
  };

  return (
    <div className="paper-size" onClick={() => setVisible(!visible)}>
      <i title="Paper Type"></i>
      <div className={`options ${visible ? 'visible' : ''}`}>
        <ul>
          {SIZES.map(({ label, width, height }) => (
            <li
              key={label}
              onClick={() => handlePaperSize(width, height)}
              className={paperWidth === width && paperHeight === height ? 'active' : ''}
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
