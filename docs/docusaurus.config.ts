import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Windoc',
  tagline: 'Canvas-based document editor for the web',
  favicon: 'img/favicon_io/favicon.ico',

  headTags: [
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/windoc/img/favicon_io/favicon-32x32.png' } },
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/windoc/img/favicon_io/favicon-16x16.png' } },
    { tagName: 'link', attributes: { rel: 'apple-touch-icon', sizes: '180x180', href: '/windoc/img/favicon_io/apple-touch-icon.png' } },
    { tagName: 'link', attributes: { rel: 'manifest', href: '/windoc/img/favicon_io/site.webmanifest' } },
  ],

  future: {
    v4: true,
  },

  url: 'https://aliansyahfirdaus.github.io',
  baseUrl: '/windoc/',

  organizationName: 'aliansyahFirdaus',
  projectName: 'windoc',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    ['@docusaurus/plugin-google-gtag', { trackingID: 'G-M5CV6YKRW9' }],
  ],

  themeConfig: {
    image: 'img/logo-text-black.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'Windoc',
        src: 'img/logo-text-white.png',
        srcDark: 'img/logo-text-black.png',
        height: 36,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://www.npmjs.com/package/@windoc/core',
          label: 'npm',
          position: 'right',
        },
        {
          type: 'html',
          position: 'right',
          value: '<a href="https://github.com/aliansyahFirdaus/windoc" class="header-github-link navbar__item navbar__link" aria-label="GitHub repository" target="_blank" rel="noopener noreferrer"><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">GitHub</span></a>',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'API Reference',
              to: '/docs/api/core',
            },
            {
              label: 'Guides',
              to: '/docs/guides/custom-toolbar',
            },
          ],
        },
        {
          title: 'Packages',
          items: [
            {
              label: '@windoc/core',
              href: 'https://www.npmjs.com/package/@windoc/core',
            },
            {
              label: '@windoc/react',
              href: 'https://www.npmjs.com/package/@windoc/react',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/aliansyahFirdaus/windoc',
            },
            {
              label: 'Issues',
              href: 'https://github.com/aliansyahFirdaus/windoc/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Windoc`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'tsx', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
