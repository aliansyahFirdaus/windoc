import { FileText } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function ExportDocxTool() {
  const { editorRef } = useEditor();
  return (
    <div
      className="menu-item__export-docx"
      title="Export DOCX"
      onClick={() => {
        void editorRef.current?.command.executeExportDocx();
      }}
    >
      <FileText size={16} />
    </div>
  );
}
