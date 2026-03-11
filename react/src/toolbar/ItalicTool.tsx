import { Italic } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function ItalicTool() {
  const { editorRef, isApple, rangeStyle } = useEditor();
  const isActive = rangeStyle?.italic === true;
  return (
    <div
      className={`menu-item__italic ${isActive ? 'active' : ''}`}
      title={`Italic(${isApple ? '⌘' : 'Ctrl'}+I)`}
      onClick={() => editorRef.current?.command.executeItalic()}
    >
      <Italic size={16} />
    </div>
  );
}
