import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Windoc',
  tagline: 'Canvas-based document editor for the web',
  favicon: 'img/favicon.ico',

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
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Windoc',
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
          href: 'https://github.com/aliansyahFirdaus/windoc',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
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
