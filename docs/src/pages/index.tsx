import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import LiveDemo from '@site/src/components/LiveDemo';
import styles from './index.module.css';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Windoc',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  description:
    'Canvas-based document editor for the web with pixel-perfect pagination, rich text formatting, tables, images, and print support.',
  url: 'https://aliansyahfirdaus.github.io/windoc/',
  sameAs: [
    'https://github.com/aliansyahFirdaus/windoc',
    'https://www.npmjs.com/package/@windoc/core',
  ],
  license: 'https://opensource.org/licenses/MIT',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.gridBg} />
      <div className={styles.heroInner}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          v0.2.1 — Now available on npm
        </div>
        <h1 className={styles.heroTitle}>
          Canvas document editor{' '}
          <span className={styles.heroTitleAccent}>for the web</span>
        </h1>
        <p className={styles.heroDescription}>
          A React document editor and web document editor built on HTML5 Canvas.
          Pixel-perfect rendering, true pagination, and print fidelity —
          a modern alternative to DOM-based editors.
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

function DemoSection() {
  return (
    <section className={styles.demoSection}>
      <div className={styles.demoInner}>
        <div className={styles.featuresHeader}>
          <div className={styles.sectionLabel}>Try it out</div>
          <h2 className={styles.sectionTitle}>See it in action</h2>
          <p className={styles.demoSubtitle}>
            A fully interactive editor running right here in your browser.
            Try typing, formatting, or inserting a table.
          </p>
        </div>
        <LiveDemo />
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
            <span className={styles.packageVersion}>0.2.1</span>
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
      title="Canvas Document Editor for React & Web"
      description="Windoc is a canvas document editor for web and React with pixel-perfect pagination, rich text, composable UI components, and print support."
    >
      <Head>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
      <main>
        <Hero />
        <DemoSection />
        <Features />
        <Packages />
        <BottomCta />
      </main>
    </Layout>
  );
}
