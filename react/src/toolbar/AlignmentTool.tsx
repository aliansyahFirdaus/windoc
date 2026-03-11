import { useEditor } from '../EditorContext';

export default function AlignmentTool() {
  const { editorRef, isApple } = useEditor();
  return (
    <div
      className="menu-item__alignment"
      title={`Justify(${isApple ? '⌘' : 'Ctrl'}+J)`}
      onClick={() => editorRef.current?.command.executeRowFlex('alignment')}
    >
      <i></i>
    </div>
  );
}
