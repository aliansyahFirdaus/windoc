import { useRef, type MouseEvent } from 'react';
import { Download, FileDown, FileText } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function ExportTool() {
  const { editorRef } = useEditor();
  const optionsRef = useRef<HTMLDivElement>(null);

  const close = () => optionsRef.current?.classList.remove('visible');

  const handleExport = async (
    type: 'pdf' | 'docx',
    event: MouseEvent<HTMLLIElement>
  ) => {
    event.stopPropagation();
    close();

    if (type === 'pdf') {
      await editorRef.current?.command.executeExportPdf();
      return;
    }

    await editorRef.current?.command.executeExportDocx();
  };

  return (
    <div
      className="menu-item__export"
      title="Export"
      onClick={() => optionsRef.current?.classList.toggle('visible')}
    >
      <Download size={16} />
      <div className="options" ref={optionsRef} style={{ width: '152px' }}>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <li onClick={event => void handleExport('pdf', event)}>
            <FileDown size={14} />
            <span>Export PDF</span>
          </li>
          <li onClick={event => void handleExport('docx', event)}>
            <FileText size={14} />
            <span>Export DOCX</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
