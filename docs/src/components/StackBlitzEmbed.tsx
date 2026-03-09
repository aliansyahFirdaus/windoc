import React, { useEffect, useRef } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Base files shared across all embeds
const BASE_FILES = {
  'package.json': JSON.stringify(
    {
      name: 'windoc-demo',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'tsc && vite build' },
      dependencies: {
        '@windoc/core': '^0.2.0',
        '@windoc/react': '^0.2.0',
        'lucide-react': '^0.563.0',
        react: '^18.3.0',
        'react-dom': '^18.3.0',
      },
      devDependencies: {
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.3.0',
        typescript: '^5.5.3',
        vite: '^5.4.2',
      },
    },
    null,
    2
  ),
  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
`,
  'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Windoc Demo</title>
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
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
      },
      include: ['src'],
    },
    null,
    2
  ),
  'src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
`,
  'src/index.css': `* { box-sizing: border-box; margin: 0; padding: 0; }
body { overflow: hidden; }

/* Fix toolbar positioning */
div.menu {
  position: relative !important;
  top: auto !important;
  flex-shrink: 0;
  flex-wrap: wrap !important;
  padding: 4px 8px !important;
}
`,
};

const DEFAULT_APP = `import { Editor } from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'

export default function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Editor
        options={{
          margins: [40, 40, 40, 40],
          placeholder: { data: 'Start typing...' },
        }}
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
      />
    </div>
  )
}
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
