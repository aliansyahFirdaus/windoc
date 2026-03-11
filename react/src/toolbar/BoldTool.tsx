import { Bold } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function BoldTool() {
  const { editorRef, isApple, rangeStyle } = useEditor();
  const isActive = rangeStyle?.bold === true;
  return (
    <div
      className={`menu-item__bold ${isActive ? 'active' : ''}`}
      title={`Bold(${isApple ? '⌘' : 'Ctrl'}+B)`}
      onClick={() => editorRef.current?.command.executeBold()}
    >
      <Bold size={16} />
    </div>
  );
}
