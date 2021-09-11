import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { terser } from 'rollup-plugin-terser';
import path from 'path';

import pkg from './package.json';

function sourcemapPathTransform(sourcePath) {
  return path.join('node_modules', pkg.name, './src', sourcePath);
}

export default [
  {
    input: 'src/main.js',
    output: [
      {
        file: 'dist/peaks.js',
        name: 'peaks',
        format: 'umd',
        sourcemap: true,
        sourcemapPathTransform,
        freeze: false
      },
      {
        file: 'dist/peaks.min.js',
        name: 'peaks',
        format: 'umd',
        sourcemap: true,
        sourcemapPathTransform,
        plugins: [
          terser()
        ]
      }
    ],
    external: [],
    plugins: [
      commonjs(),
      resolve({ browser: true }),
      babel({ babelHelpers: 'bundled' })
    ]
  },
  {
    input: 'src/main.js',
    output: [
      {
        file: 'dist/peaks.esm.js',
        name: 'peaks',
        format: 'es',
        sourcemap: true,
        sourcemapPathTransform,
        freeze: false
      }
    ],
    plugins: [
      peerDepsExternal(),
      commonjs(),
      resolve({ browser: true }),
      babel({ babelHelpers: 'bundled' })
    ]
  }
];
