import { Undo } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function UndoTool() {
  const { editorRef, isApple, rangeStyle } = useEditor();
  const isDisabled = rangeStyle ? !rangeStyle.undo : true;
  return (
    <div
      className={`menu-item__undo${isDisabled ? ' disabled' : ''}`}
      title={`Undo(${isApple ? '⌘' : 'Ctrl'}+Z)`}
      onClick={() => {
        if (!isDisabled) editorRef.current?.command.executeUndo();
      }}
    >
      <Undo size={16} />
    </div>
  );
}
