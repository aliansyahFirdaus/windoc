import { Image as ImageIcon } from 'lucide-react';
import { useEditor } from '../EditorContext';

export default function ImageTool() {
  const { editorRef } = useEditor();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        editorRef.current?.command.executeImage({
          value: reader.result as string,
          width: img.width,
          height: img.height
        });
      };
    };
    e.target.value = '';
  };

  return (
    <div
      className="menu-item__image"
      onClick={() => document.getElementById('image')?.click()}
    >
      <ImageIcon size={16} />
      <input
        type="file"
        id="image"
        accept=".png, .jpg, .jpeg, .svg, .gif"
        onChange={handleImageUpload}
      />
    </div>
  );
}
