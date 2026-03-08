import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.gridBg} />
      <div className={styles.heroInner}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          v0.2.0 — Now available on npm
        </div>
        <h1 className={styles.heroTitle}>
          The document editor{' '}
          <span className={styles.heroTitleAccent}>built on Canvas</span>
        </h1>
        <p className={styles.heroDescription}>
          Pixel-perfect rendering, true pagination, and print fidelity.
          A modern alternative to DOM-based editors — designed for documents
          that need to look exactly right.
        </p>
        <div className={styles.heroCtas}>
          <Link to="/docs" className={styles.ctaPrimary}>
            Get Started
            <span>&#8594;</span>
          </Link>
          <Link to="/docs/api/core" className={styles.ctaSecondary}>
            API Reference
          </Link>
        </div>
        <div className={styles.installBar}>
          <code className={styles.installCommand}>
            <span className={styles.installPrompt}>$</span>
            npm install @windoc/core @windoc/react
          </code>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: '&#9649;',
    title: 'Canvas Rendering',
    description:
      'High-performance rendering via HTML5 Canvas. Documents look identical on screen and in print — no DOM quirks, no browser inconsistencies.',
  },
  {
    icon: '&#9634;',
    title: 'True Pagination',
    description:
      'Real page breaks with configurable paper sizes, margins, headers, footers, and page numbers. Not simulated — actual pages.',
  },
  {
    icon: '&#9881;',
    title: 'Composable React UI',
    description:
      'Every toolbar and footer tool is an individual component. Mix and match, or build your own from scratch using hooks.',
  },
  {
    icon: '&#9998;',
    title: 'Rich Text Editing',
    description:
      'Bold, italic, underline, strikethrough, color, highlight, fonts, sizes, headings, lists, alignment — everything you need.',
  },
  {
    icon: '&#9638;',
    title: 'Tables & Images',
    description:
      'Full table support with merge, split, borders, and row/column operations. Inline images with resize, rotate, and alignment.',
  },
  {
    icon: '&#9113;',
    title: 'Print & Export',
    description:
      'Native print support with accurate pagination. Get and set document data as JSON for persistence and collaboration.',
  },
];

function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.featuresHeader}>
        <div className={styles.sectionLabel}>Features</div>
        <h2 className={styles.sectionTitle}>Everything you need to build</h2>
      </div>
      <div className={styles.featuresGrid}>
        {features.map((f) => (
          <div key={f.title} className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              dangerouslySetInnerHTML={{__html: f.icon}}
            />
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CodeExample() {
  return (
    <section className={styles.codeSection}>
      <div className={styles.codeSectionInner}>
        <div className={styles.codeContent}>
          <h2>Drop in and start building</h2>
          <p>
            One component gives you a full editor with toolbar, canvas area,
            and status bar. Customize everything through props and hooks.
          </p>
          <ul className={styles.codeFeatureList}>
            <li>
              <span className={styles.checkIcon}>&#10003;</span>
              Works with Next.js, Vite, and any React setup
            </li>
            <li>
              <span className={styles.checkIcon}>&#10003;</span>
              TypeScript-first with full type definitions
            </li>
            <li>
              <span className={styles.checkIcon}>&#10003;</span>
              Customize toolbar, footer, or go headless
            </li>
            <li>
              <span className={styles.checkIcon}>&#10003;</span>
              Get/set document data as JSON
            </li>
            <li>
              <span className={styles.checkIcon}>&#10003;</span>
              Register shortcuts and context menus
            </li>
          </ul>
        </div>
        <div className={styles.codeBlock}>
          <div className={styles.codeBlockHeader}>
            <span className={styles.codeBlockDot} />
            <span className={styles.codeBlockDot} />
            <span className={styles.codeBlockDot} />
            <span className={styles.codeBlockTitle}>App.tsx</span>
          </div>
          <div className={styles.codeBlockBody}>
            <pre>
              <span className={styles.codeKeyword}>import</span>
              {' { Editor } '}
              <span className={styles.codeKeyword}>from</span>
              {' '}
              <span className={styles.codeString}>'@windoc/react'</span>
              {'\n'}
              <span className={styles.codeKeyword}>import</span>
              {' '}
              <span className={styles.codeString}>'@windoc/core/style.css'</span>
              {'\n'}
              <span className={styles.codeKeyword}>import</span>
              {' '}
              <span className={styles.codeString}>'@windoc/react/style.css'</span>
              {'\n\n'}
              <span className={styles.codeKeyword}>export default</span>
              {' '}
              <span className={styles.codeKeyword}>function</span>
              {' '}
              <span className={styles.codeFunc}>App</span>
              <span className={styles.codePunc}>{'() {'}</span>
              {'\n  '}
              <span className={styles.codeKeyword}>return</span>
              {' '}
              <span className={styles.codePunc}>(</span>
              {'\n    '}
              <span className={styles.codeTag}>{'<Editor'}</span>
              {'\n      '}
              <span className={styles.codeAttr}>defaultValue</span>
              <span className={styles.codePunc}>={'{{ '}</span>
              <span className={styles.codeAttr}>main</span>
              <span className={styles.codePunc}>{': [] }}'}</span>
              {'\n      '}
              <span className={styles.codeAttr}>options</span>
              <span className={styles.codePunc}>={'={{'}</span>
              {'\n        '}
              <span className={styles.codeAttr}>margins</span>
              <span className={styles.codePunc}>{': '}</span>
              <span className={styles.codePunc}>{'[40, 40, 40, 40]'}</span>
              <span className={styles.codePunc}>{','}</span>
              {'\n        '}
              <span className={styles.codeAttr}>placeholder</span>
              <span className={styles.codePunc}>{': { '}</span>
              <span className={styles.codeAttr}>data</span>
              <span className={styles.codePunc}>{': '}</span>
              <span className={styles.codeString}>'Start typing...'</span>
              <span className={styles.codePunc}>{' }'}</span>
              {'\n      '}
              <span className={styles.codePunc}>{'}}'}</span>
              {'\n      '}
              <span className={styles.codeAttr}>onReady</span>
              <span className={styles.codePunc}>{'={(editor) =>'}</span>
              {'\n        '}
              <span className={styles.codeFunc}>console</span>
              <span className={styles.codePunc}>.</span>
              <span className={styles.codeFunc}>log</span>
              <span className={styles.codePunc}>(</span>
              <span className={styles.codeString}>'Ready!'</span>
              <span className={styles.codePunc}>{', editor)'}</span>
              {'\n      '}
              <span className={styles.codePunc}>{'}'}</span>
              {'\n    '}
              <span className={styles.codeTag}>{'/>'}</span>
              {'\n  '}
              <span className={styles.codePunc}>)</span>
              {'\n'}
              <span className={styles.codePunc}>{'}'}</span>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Packages() {
  return (
    <section className={styles.packages}>
      <div className={styles.featuresHeader}>
        <div className={styles.sectionLabel}>Packages</div>
        <h2 className={styles.sectionTitle}>Two packages, one editor</h2>
      </div>
      <div className={styles.packagesGrid}>
        <div className={styles.packageCard}>
          <div>
            <span className={styles.packageName}>@windoc/core</span>
            <span className={styles.packageVersion}>0.2.0</span>
          </div>
          <p className={styles.packageDesc}>
            The canvas editor engine. Framework-agnostic — renders documents
            using HTML5 Canvas with full command API, listeners, shortcuts,
            context menus, and plugin support.
          </p>
          <Link to="/docs/api/core" className={styles.packageLink}>
            View API &#8594;
          </Link>
        </div>
        <div className={styles.packageCard}>
          <div>
            <span className={styles.packageName}>@windoc/react</span>
            <span className={styles.packageVersion}>0.2.0</span>
          </div>
          <p className={styles.packageDesc}>
            React bindings with a ready-to-use {'<Editor />'} component.
            Includes composable toolbar and footer tools, context providers,
            and hooks for building custom UI.
          </p>
          <Link to="/docs/api/react" className={styles.packageLink}>
            View API &#8594;
          </Link>
        </div>
      </div>
    </section>
  );
}

function BottomCta() {
  return (
    <section className={styles.bottomCta}>
      <h2 className={styles.bottomCtaTitle}>Ready to build?</h2>
      <p className={styles.bottomCtaDesc}>
        Get started with Windoc in minutes.
      </p>
      <div className={styles.heroCtas}>
        <Link to="/docs/getting-started" className={styles.ctaPrimary}>
          Read the Docs
          <span>&#8594;</span>
        </Link>
        <a
          href="https://www.npmjs.com/package/@windoc/react"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaSecondary}
        >
          View on npm
        </a>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Canvas Document Editor"
      description="Canvas-based document editor for the web with pixel-perfect pagination, rich text, tables, and print support."
    >
      <main>
        <Hero />
        <Features />
        <CodeExample />
        <Packages />
        <BottomCta />
      </main>
    </Layout>
  );
}
