import { useState } from 'react';
import { useEditor } from '../EditorContext';

export default function PaperDirectionTool() {
  const { editorRef } = useEditor();
  const [visible, setVisible] = useState(false);

  const handlePaperDirection = (direction: string) => {
    editorRef.current?.command.executePaperDirection(direction);
    setVisible(false);
  };

  return (
    <div className="paper-direction" onClick={() => setVisible(!visible)}>
      <i title="Paper Direction"></i>
      <div className={`options ${visible ? 'visible' : ''}`}>
        <ul>
          <li
            onClick={() => handlePaperDirection('vertical')}
            className="active"
          >
            Portrait
          </li>
          <li onClick={() => handlePaperDirection('horizontal')}>Landscape</li>
        </ul>
      </div>
    </div>
  );
}
