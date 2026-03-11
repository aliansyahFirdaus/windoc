import { useEditor } from '../EditorContext';

export default function SizeAddTool() {
  const { editorRef, isApple } = useEditor();
  return (
    <div
      className="menu-item__size-add"
      title={`Increase font size(${isApple ? '⌘' : 'Ctrl'}+[)`}
      onClick={() => editorRef.current?.command.executeSizeAdd()}
    >
      <i></i>
    </div>
  );
}
