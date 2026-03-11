import { AlignJustify } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function JustifyTool() {
  const { editorRef, isApple, rangeStyle } = useEditor();
  const isActive =
    rangeStyle?.rowFlex === 'justify' || rangeStyle?.rowFlex === 'alignment';
  return (
    <div
      className={`menu-item__justify ${isActive ? 'active' : ''}`}
      title={`Distribute(${isApple ? '⌘' : 'Ctrl'}+Shift+J)`}
      onClick={() => editorRef.current?.command.executeRowFlex('justify')}
    >
      <AlignJustify size={16} />
    </div>
  );
}
