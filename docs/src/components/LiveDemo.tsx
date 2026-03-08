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
                {value: 'Windoc', bold: true},
                {value: ' — a canvas-based document editor. '},
                {value: '\n'},
                {value: '\n'},
                {value: 'Try editing this text, inserting a table, or changing the formatting using the toolbar above. '},
                {value: 'Everything you see is rendered on HTML5 Canvas ', italic: true},
                {value: 'with pixel-perfect precision.', italic: true},
              ],
            }}
            options={{
              margins: [30, 30, 30, 30],
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
