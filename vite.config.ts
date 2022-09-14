import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type UserConfig } from 'vite';
import checker from 'vite-plugin-checker';
import banner from 'vite-plugin-banner';
import vue from '@vitejs/plugin-vue2';
import path from 'path';

const pkg = require('./package.json');

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  const config: UserConfig = {
    resolve: {
      // https://vitejs.dev/config/#resolve-alias
      alias: [
        // make vue external
        {
          find: 'vue',
          replacement: path.resolve(
            __dirname,
            './node_modules/vue/dist/vue.runtime.esm.js'
          ),
        },
        {
          find: 'vuetify',
          replacement: path.resolve(__dirname, './node_modules/vuetify'),
        },
        {
          // vue @ shortcut fix
          find: '@/',
          replacement: `${path.resolve(__dirname, './src')}/`,
        },
      ],
      // External
      dedupe: ['vue', 'vuetify'],
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
      checker({ typescript: true, vueTsc: false }),
      // vite-plugin-banner
      // https://github.com/chengpeiquan/vite-plugin-banner
      banner(`/**
 * ${pkg.name}
 *
 * @description ${pkg.description}
 * @author ${pkg.author.name} <${pkg.author.email}>
 * @copyright 2022 By Masashi Yoshikawa All rights reserved.
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @see {@link ${pkg.homepage}}
 */
`),
      command === 'serve'
        ? // unplugin-vue-components
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
          })
        : undefined,
    ],
    optimizeDeps: {
      exclude: ['vue-demi'],
    },
    // Build Options
    // https://vitejs.dev/config/#build-options
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
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
                filename: 'dist/stats.html',
                gzipSize: true,
                brotliSize: true,
              })
            : undefined,
        ],
        external: [
          'vue',
          'vue-demi',
          'vuetify/lib/components',
          'vuetify/lib/util/colors',
        ],
        output: {
          exports: 'named',
          globals: {
            vue: 'Vue',
            'vuetify/lib/components': 'Vuetify',
            'vuetify/lib/util/colors': 'colors',
            'vue-demi': 'VueDemi',
          },
        },
      },
      target: 'es2021',
      minify: 'esbuild',
    },
    esbuild: {
      drop: command === 'serve' ? [] : ['console'],
    },
  };
  // Export vite config
  return config;
});
