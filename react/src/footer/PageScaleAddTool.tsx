import { useEditor } from '../EditorContext';

export default function PageScaleAddTool() {
  const { editorRef } = useEditor();
  return (
    <div
      className="page-scale-add"
      title="Zoom In (Ctrl+=)"
      onClick={() => editorRef.current?.command.executePageScaleAdd()}
    >
      <i></i>
    </div>
  );
}
