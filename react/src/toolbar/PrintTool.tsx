import { useEditor } from '../EditorContext';

export default function PrintTool() {
  const { editorRef, isApple } = useEditor();
  return (
    <div
      className="menu-item__print"
      title={`Print(${isApple ? '⌘' : 'Ctrl'}+P)`}
      onClick={() => editorRef.current?.command.executePrint()}
    >
      <i></i>
    </div>
  );
}
