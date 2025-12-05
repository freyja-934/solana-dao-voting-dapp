import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
      ],
    },
    {
      type: 'category',
      label: 'Smart Contracts',
      items: [
        'contracts/dao-program',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      items: [
        'frontend/frontend-architecture',
      ],
    },
    {
      type: 'category',
      label: 'Setup',
      items: [
        'setup/local-development',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/production-deployment',
      ],
    },
    {
      type: 'category',
      label: 'Testing',
      items: [
        'testing/testing-guide',
      ],
    },
    {
      type: 'category',
      label: 'Operations',
      items: [
        'operations/runbook',
      ],
    },
  ],
};

export default sidebars;