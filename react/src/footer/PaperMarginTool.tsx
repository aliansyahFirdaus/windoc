import { useEditor } from '../EditorContext';
import { pxToCm, cmToPx } from '@windoc/core';

export default function PaperMarginTool() {
  const { editorRef } = useEditor();

  const handlePaperMargin = async () => {
    if (!editorRef.current) return;
    const { Dialog } = await import('@windoc/core');
    const [topMargin, rightMargin, bottomMargin, leftMargin] =
      editorRef.current.command.getPaperMargin();
    new Dialog({
      title: 'Page Margins',
      data: [
        {
          type: 'text',
          label: 'Top Margin (cm)',
          name: 'top',
          required: true,
          value: `${pxToCm(topMargin)}`,
          placeholder: 'e.g. 2.54'
        },
        {
          type: 'text',
          label: 'Bottom Margin (cm)',
          name: 'bottom',
          required: true,
          value: `${pxToCm(bottomMargin)}`,
          placeholder: 'e.g. 2.54'
        },
        {
          type: 'text',
          label: 'Left Margin (cm)',
          name: 'left',
          required: true,
          value: `${pxToCm(leftMargin)}`,
          placeholder: 'e.g. 2.54'
        },
        {
          type: 'text',
          label: 'Right Margin (cm)',
          name: 'right',
          required: true,
          value: `${pxToCm(rightMargin)}`,
          placeholder: 'e.g. 2.54'
        }
      ],
      onConfirm: (payload: Array<{ name: string; value: string }>) => {
        const top = payload.find(p => p.name === 'top')?.value;
        if (!top) return;
        const bottom = payload.find(p => p.name === 'bottom')?.value;
        if (!bottom) return;
        const left = payload.find(p => p.name === 'left')?.value;
        if (!left) return;
        const right = payload.find(p => p.name === 'right')?.value;
        if (!right) return;
        editorRef.current?.command.executeSetPaperMargin([
          cmToPx(Number(top)),
          cmToPx(Number(right)),
          cmToPx(Number(bottom)),
          cmToPx(Number(left))
        ]);
      }
    });
  };

  return (
    <div
      className="paper-margin"
      title="Page Margins"
      onClick={handlePaperMargin}
    >
      <i></i>
    </div>
  );
}
