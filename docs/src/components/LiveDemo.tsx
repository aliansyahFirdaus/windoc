import React, {useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './LiveDemo.module.css';

const CODE_EXAMPLE = `import { Editor } from '@windoc/react'
import '@windoc/core/style.css'
import '@windoc/react/style.css'

export default function App() {
  return (
    <Editor
      defaultValue={{
        main: [
          { value: 'Welcome to ' },
          { value: 'Windoc', bold: true },
          { value: ' — a canvas-based document editor.' },
        ],
      }}
      options={{
        margins: [40, 40, 40, 40],
        placeholder: { data: 'Start typing...' },
        watermark: { data: '', size: 120 },
      }}
    />
  )
}`;

function EditorRenderer() {
  return (
    <BrowserOnly fallback={<div className={styles.loading}>Loading editor...</div>}>
      {() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {Editor} = require('@windoc/react');
        require('@windoc/core/style.css');
        require('@windoc/react/style.css');
        return (
          <Editor
            toolbar={true}
            footer={true}
            defaultValue={{
              main: [
                {value: 'Welcome to '},
                {value: 'Windoc', bold: true, size: 28},
                {value: '\n'},
                {value: '\n'},
                {value: 'A canvas-based document editor for the web. Try the full editing experience below:', size: 14},
                {value: '\n'},
                {value: '\n'},
                {value: 'Rich Text — ', bold: true, size: 14},
                {value: 'Bold, ', bold: true, size: 14},
                {value: 'italic, ', italic: true, size: 14},
                {value: 'underline', underline: true, size: 14},
                {value: ', colors, highlights, fonts, and sizes.', size: 14},
                {value: '\n'},
                {value: '\n'},
                {value: 'Use the toolbar above to format text, insert tables, images, and more. ', size: 14},
                {value: 'Use the footer bar below to change paper size, zoom, and page settings.', size: 14},
              ],
            }}
            options={{
              margins: [40, 40, 40, 40],
              defaultBasicRowMarginHeight: 5,
              placeholder: {data: 'Start typing...'},
              watermark: {data: '', size: 120},
              header: {disabled: true},
              footer: {disabled: true},
              pageNumber: {disabled: true},
              zone: {tipDisabled: true},
              maskMargin: [0, 0, 0, 0],
              scrollContainerSelector: '.demo-editor',
            }}
            className="demo-editor"
            style={{flex: 1, minHeight: 0, overflow: 'auto'}}
          />
        );
      }}
    </BrowserOnly>
  );
}

export default function LiveDemo() {
  const [activeTab, setActiveTab] = useState<'demo' | 'code'>('demo');

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'demo' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('demo')}
        >
          <span className={styles.tabDot} data-color="green" />
          Live Demo
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'code' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <span className={styles.tabDot} data-color="blue" />
          Code
        </button>
      </div>
      <div className={styles.content}>
        {activeTab === 'demo' ? (
          <div className={styles.editorFrame}>
            <EditorRenderer />
          </div>
        ) : (
          <div className={styles.codeFrame}>
            <pre className={styles.codeContent}>
              <code>{CODE_EXAMPLE}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
