import { checker } from 'vite-plugin-checker';
import { defineConfig, type UserConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import banner from 'vite-plugin-banner';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue2';
import Components from 'unplugin-vue-components/vite';

import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';

const pkg = require('./package.json');

// https://vitejs.dev/config/
export default defineConfig(async ({ mode, command }): Promise<UserConfig> => {
  const config: UserConfig = {
    base: './',
    publicDir: command === 'serve' ? 'public' : false,
    // Resolver
    resolve: {
      // https://vitejs.dev/config/shared-options.html#resolve-alias
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': fileURLToPath(new URL('./node_modules', import.meta.url)),
        'vuetify-swatches': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // https://vitejs.dev/config/#server-options
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
    },
    plugins: [
      // Vue2
      // https://github.com/vitejs/vite-plugin-vue2
      vue(),
      // vite-plugin-checker
      // https://github.com/fi3ework/vite-plugin-checker
      checker({
        typescript: true,
        vueTsc: true,
        eslint: {
          lintCommand: 'eslint',
        },
      }),
      // vite-plugin-banner
      // https://github.com/chengpeiquan/vite-plugin-banner
      banner(`/**
 * ${pkg.name}
 *
 * @description ${pkg.description}
 * @author ${pkg.author.name} <${pkg.author.email}>
 * @copyright 2022-2023 By Masashi Yoshikawa All rights reserved.
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @see {@link ${pkg.homepage}}
 */
`),
      // vite-plugin-dts
      // https://github.com/qmhc/vite-plugin-dts
      mode === 'docs'
        ? undefined
        : dts({
            tsConfigFilePath: './tsconfig.app.json',
          }),
      // unplugin-vue-components
      // https://github.com/antfu/unplugin-vue-components
      Components({
        // generate `components.d.ts` global declarations
        // https://github.com/antfu/unplugin-vue-components#typescript
        dts: true,
        // auto import for directives
        directives: false,
        // resolvers for custom components
        resolvers: [
          // Vuetify
          VuetifyResolver(),
        ],
      }),
    ],
    optimizeDeps: {
      exclude: [
        'vue-demi',
        // https://github.com/codemirror/dev/issues/608
        '@codemirror/state',
      ],
    },
    // Build Options
    // https://vitejs.dev/config/#build-options
    build: {
      outDir: mode === 'docs' ? 'docs' : undefined,
      lib:
        mode === 'docs'
          ? undefined
          : {
              entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
              name: 'VSwatches',
              formats: ['umd', 'es', 'iife'],
              fileName: format => `index.${format}.js`,
            },

      rollupOptions: {
        plugins: [
          mode === 'analyze'
            ? // rollup-plugin-visualizer
              // https://github.com/btd/rollup-plugin-visualizer
              visualizer({
                open: true,
                filename: 'stats.html',
                gzipSize: false,
                brotliSize: false,
              })
            : undefined,
        ],
        external:
          mode === 'docs'
            ? undefined
            : ['vue', 'vue-demi', 'vuetify/lib', 'vuetify/lib/util/colors'],
        output: {
          esModule: true,
          generatedCode: {
            reservedNamesAsProps: false,
          },
          interop: 'compat',
          systemNullSetters: false,
          exports: 'named',
          globals: {
            'vue-demi': 'VueDemi',
            'vuetify/lib': 'Vuetify',
            'vuetify/lib/util/colors': 'colors',
            lodash: 'lodash',
            vue: 'Vue',
          },
          manualChunks:
            mode !== 'docs'
              ? undefined
              : {
                  vue: ['vue'],
                  vuetify: ['vuetify/lib'],
                  codemirror: [
                    'vue-codemirror6',
                    'codemirror',
                    '@codemirror/autocomplete',
                    '@codemirror/commands',
                    '@codemirror/language',
                    '@codemirror/lint',
                    '@codemirror/search',
                    '@codemirror/state',
                    '@codemirror/view',
                  ],
                  'codemirror-lang': ['@codemirror/lang-vue'],
                },
        },
      },
      // Minify option
      target: 'esnext',
      minify: mode === 'docs',
    },
    esbuild: {
      drop: command === 'serve' ? [] : ['console'],
    },
  };

  // Write meta data.
  fs.writeFileSync(
    fileURLToPath(new URL('./src/Meta.ts', import.meta.url)),
    `import type MetaInterface from '@/interfaces/MetaInterface';

// This file is auto-generated by the build system.
const meta: MetaInterface = {
  version: '${pkg.version}',
  date: '${new Date().toISOString()}',
};
export default meta;
`
  );

  // Export vite config
  return config;
});
