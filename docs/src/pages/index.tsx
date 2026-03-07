import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Feature({title, description}: {title: string; description: string}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md padding-vert--lg">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Canvas Document Editor"
      description="Canvas-based document editor for the web with pixel-perfect pagination, rich text, tables, and print support.">
      <HomepageHeader />
      <main>
        <section className="padding-vert--xl">
          <div className="container">
            <div className="row">
              <Feature
                title="Canvas Rendering"
                description="High-performance rendering via HTML5 Canvas. Pixel-perfect documents that look exactly the same on screen and in print."
              />
              <Feature
                title="True Pagination"
                description="Real page breaks with configurable paper sizes, margins, headers, footers, and page numbers. Not simulated — actual pages."
              />
              <Feature
                title="Composable React UI"
                description="Mix and match toolbar and footer components, or build your own from scratch using hooks. Full control over the editor UI."
              />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
