import { createRoot } from 'react-dom/client'
import { Editor } from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <Editor
        defaultValue={{
          main: [{ value: 'Hello, this is a test paragraph.', size: 11 }],
        }}
        options={{
          placeholder: { data: 'Start typing...' },
        }}
      />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
