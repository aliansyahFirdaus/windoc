import React, { useEffect, useRef } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Base files — kept identical to playground/ (source of truth)
// Only difference: packages come from npm instead of local file://
const BASE_FILES = {
  'package.json': JSON.stringify(
    {
      name: 'windoc-demo',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'tsc && vite build' },
      dependencies: {
        '@windoc/core': '0.3.0',
        '@windoc/react': '0.3.0',
        'lucide-react': '^0.563.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies: {
        '@types/react': '^19',
        '@types/react-dom': '^19',
        '@vitejs/plugin-react': '^4.5.2',
        typescript: '^5',
        vite: '^6',
      },
    },
    null,
    2
  ),
  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
`,
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Windoc Playground</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`,
  'tsconfig.json': JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ['src'],
    },
    null,
    2
  ),
  'src/main.tsx': `import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
`,
};

const DEFAULT_APP = `import {
  Editor,
  ColumnTool,
  PageBreakTool,
  TableTool,
  TitleTool,
  FontTool,
  FontSizeTool,
  ColorTool,
  HighlightTool,
  BoldTool,
  ItalicTool,
  UnderlineTool,
  StrikeoutTool,
  LeftAlignTool,
  CenterAlignTool,
  RightAlignTool,
  ListTool,
  ImageTool,
} from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'

const D = () => <div className="menu-divider" style={{ margin: '0 3px' }} />

const toolbar = (
  <div className="menu" editor-component="menu">
    <div className="menu-item"><ColumnTool /></div>
    <D />
    <div className="menu-item"><PageBreakTool /></div>
    <D />
    <div className="menu-item"><TableTool /></div>
    <D />
    <div className="menu-item"><TitleTool /><FontTool /><FontSizeTool /></div>
    <D />
    <div className="menu-item"><ColorTool /><HighlightTool /><BoldTool /><ItalicTool /><UnderlineTool /><StrikeoutTool /></div>
    <D />
    <div className="menu-item"><LeftAlignTool /><CenterAlignTool /><RightAlignTool /></div>
    <D />
    <div className="menu-item"><ListTool /></div>
    <D />
    <div className="menu-item"><ImageTool /></div>
  </div>
)

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <Editor
        options={{ placeholder: { data: 'Start typing...' } }}
        renderToolbar={toolbar}
      />
    </div>
  )
}

export default App
`;

interface StackBlitzEmbedProps {
  /** Custom App.tsx content. Defaults to a basic Editor example. */
  appCode?: string;
  /** Height of the embed in pixels. Default: 600 */
  height?: number;
  /** Which file to open in the editor panel. Default: 'src/App.tsx' */
  openFile?: string;
  /** Project title shown in StackBlitz */
  title?: string;
}

function EmbedInner({
  appCode = DEFAULT_APP,
  height = 600,
  openFile = 'src/App.tsx',
  title = 'Windoc Demo',
}: StackBlitzEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    import('@stackblitz/sdk').then(({ default: sdk }) => {
      sdk.embedProject(
        containerRef.current!,
        {
          title,
          description: 'Windoc — canvas-based document editor',
          template: 'node',
          files: {
            ...BASE_FILES,
            'src/App.tsx': appCode,
          },
        },
        {
          height,
          openFile,
          hideNavigation: true,
          hideDevTools: true,
          theme: 'dark',
          terminalHeight: 0,
          view: 'preview',
        }
      );
    });
  }, [appCode, height, openFile, title]);

  return (
    <div
      ref={containerRef}
      style={{ height, borderRadius: 12, overflow: 'hidden' }}
    />
  );
}

export default function StackBlitzEmbed(props: StackBlitzEmbedProps) {
  return (
    <BrowserOnly fallback={<div style={{ height: props.height ?? 600 }} />}>
      {() => <EmbedInner {...props} />}
    </BrowserOnly>
  );
}
