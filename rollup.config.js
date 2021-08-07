import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'src/main.js',
    output: [
      {
        file: 'dist/peaks.js',
        name: 'peaks',
        format: 'umd',
        sourcemap: true,
        freeze: false
      },
      {
        file: 'dist/peaks.min.js',
        name: 'peaks',
        format: 'umd',
        sourcemap: true,
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
        freeze: false,
      },
      {
        file: 'dist/peaks.esm.min.js',
        name: 'peaks',
        format: 'es',
        sourcemap: true,
        plugins: [
          terser()
        ]
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
