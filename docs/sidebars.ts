import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'introduction',
    'getting-started',
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/custom-toolbar',
        'guides/custom-footer',
        'guides/drag-and-drop',
        'guides/keyboard-shortcuts',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/core',
        'api/react',
        'api/editor-options',
        'api/commands',
      ],
    },
  ],
};

export default sidebars;
