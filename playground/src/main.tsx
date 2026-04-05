import { createRoot } from 'react-dom/client';
import { Editor } from '@windoc/react';
import '@windoc/core/style.css';
import '@windoc/react/style.css';

function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Editor
        options={{
          placeholder: { data: 'Start typing...' },
          zone: { tipDisabled: false }
        }}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
