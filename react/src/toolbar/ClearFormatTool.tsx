import { useEditor } from '../EditorContext';

export default function ClearFormatTool() {
  const { editorRef } = useEditor();
  return (
    <div
      className="menu-item__format"
      title="Clear Format"
      onClick={() => editorRef.current?.command.executeFormat()}
    >
      <i></i>
    </div>
  );
}
