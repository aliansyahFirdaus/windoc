import { useEditor } from '../EditorContext';

export default function SubscriptTool() {
  const { editorRef, isApple } = useEditor();
  return (
    <div
      className="menu-item__subscript"
      title={`Subscript(${isApple ? '⌘' : 'Ctrl'}+Shift+.)`}
      onClick={() => editorRef.current?.command.executeSubscript()}
    >
      <i></i>
    </div>
  );
}
