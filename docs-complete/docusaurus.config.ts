import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'DAO Voting Platform Documentation',
  tagline: 'Decentralized governance on Solana',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://dao-voting-docs.vercel.app',
  baseUrl: '/',

  organizationName: 'lazer-consulting',
  projectName: 'solana-dao-voting',

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
          editUrl: 'https://github.com/lazer/solana-dao-voting/tree/main/docs-complete/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: 'img/dao-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'DAO Voting Docs',
      logo: {
        alt: 'DAO Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/lazer/solana-dao-voting',
          label: 'GitHub',
          position: 'right',
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
              to: '/docs/intro',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture/overview',
            },
            {
              label: 'Deployment',
              to: '/docs/deployment/production-deployment',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Solana Docs',
              href: 'https://docs.solana.com',
            },
            {
              label: 'Anchor Framework',
              href: 'https://www.anchor-lang.com',
            },
            {
              label: 'Next.js',
              href: 'https://nextjs.org',
            },
          ],
        },
        {
          title: 'Support',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/lazer/solana-dao-voting/issues',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/solana',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Lazer Consulting. Built for our clients with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust', 'toml', 'bash', 'typescript', 'solidity'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;