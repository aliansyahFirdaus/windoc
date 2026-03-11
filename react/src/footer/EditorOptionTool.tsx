import { useEditor } from '../EditorContext';

export default function EditorOptionTool() {
  const { editorRef } = useEditor();

  const handleEditorOption = async () => {
    if (!editorRef.current) return;
    const { Dialog } = await import('@windoc/core');
    const options = editorRef.current.command.getOptions();
    new Dialog({
      title: 'Editor Configuration',
      data: [
        {
          type: 'textarea',
          name: 'option',
          width: 350,
          height: 300,
          required: true,
          value: JSON.stringify(options, null, 2),
          placeholder: 'Please enter editor configuration'
        }
      ],
      onConfirm: (payload: Array<{ name: string; value: string }>) => {
        const newOptionValue = payload.find(p => p.name === 'option')?.value;
        if (!newOptionValue) return;
        const newOption = JSON.parse(newOptionValue);
        editorRef.current?.command.executeUpdateOptions(newOption);
      }
    });
  };

  return (
    <div
      className="editor-option"
      title="Editor Settings"
      onClick={handleEditorOption}
    >
      <i></i>
    </div>
  );
}
