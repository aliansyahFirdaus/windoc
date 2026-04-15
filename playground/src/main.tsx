import { createRoot } from 'react-dom/client';
import { Editor } from '@windoc/react';
import '@windoc/core/style.css';
import '@windoc/react/style.css';
import { data, options } from '../../core/src/mock';

function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Editor
        defaultValue={{ main: data }}
        options={{
          ...options,
          scale: 1.2
        }}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
