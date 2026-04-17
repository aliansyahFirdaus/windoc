import { FileText } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function ExportPdfTool() {
  const { editorRef } = useEditor();
  return (
    <div
      className="menu-item__export-pdf"
      title="Export PDF"
      onClick={() => {
        void editorRef.current?.command.executeExportPdf();
      }}
    >
      <FileText size={16} />
    </div>
  );
}
