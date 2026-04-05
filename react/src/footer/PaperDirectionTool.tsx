import { useState } from 'react';
import { useEditor } from '../EditorContext';
import { useFooter } from '../FooterContext';

export default function PaperDirectionTool() {
  const { editorRef } = useEditor();
  const { paperDirection, setPaperDirection } = useFooter();
  const [visible, setVisible] = useState(false);

  const handlePaperDirection = (direction: string) => {
    editorRef.current?.command.executePaperDirection(direction);
    setPaperDirection(direction);
    setVisible(false);
  };

  return (
    <div className="paper-direction" onClick={() => setVisible(!visible)}>
      <i title="Paper Direction"></i>
      <div className={`options ${visible ? 'visible' : ''}`}>
        <ul>
          <li
            onClick={() => handlePaperDirection('vertical')}
            className={paperDirection === 'vertical' ? 'active' : ''}
          >
            Portrait
          </li>
          <li
            onClick={() => handlePaperDirection('horizontal')}
            className={paperDirection === 'horizontal' ? 'active' : ''}
          >
            Landscape
          </li>
        </ul>
      </div>
    </div>
  );
}
