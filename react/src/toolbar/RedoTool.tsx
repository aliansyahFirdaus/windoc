import { Redo } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function RedoTool() {
  const { editorRef, isApple, rangeStyle } = useEditor();
  const isDisabled = rangeStyle ? !rangeStyle.redo : true;
  return (
    <div
      className={`menu-item__redo${isDisabled ? ' disabled' : ''}`}
      title={`Redo(${isApple ? '⌘' : 'Ctrl'}+Y)`}
      onClick={() => {
        if (!isDisabled) editorRef.current?.command.executeRedo();
      }}
    >
      <Redo size={16} />
    </div>
  );
}
