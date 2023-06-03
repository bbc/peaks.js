import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import path from 'path';

import pkg from './package.json';

const globals = {
  'waveform-data': 'WaveformData',
  'konva/lib/Core': 'Konva',
  'konva/lib/Animation': 'Konva',
  'konva/lib/shapes/Line': 'Konva',
  'konva/lib/shapes/Rect': 'Konva',
  'konva/lib/shapes/Text': 'Konva'
};

function sourcemapPathTransform(sourcePath) {
  return path.join('node_modules', pkg.name, './src', sourcePath);
}

export default [
  // dist/peaks.js and dist/peaks.min.js are stand-alone UMD modules that
  // contain all dependencies. Custom markers do not work with these builds
  {
    input: 'src/main.js',
    output: [
      {
        file: 'dist/peaks.js',
        name: 'peaks',
        format: 'umd',
        sourcemap: true,
        sourcemapPathTransform
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
    plugins: [
      commonjs(),
      resolve({ browser: true }),
      babel({ babelHelpers: 'bundled' })
    ]
  },
  // dist/peaks.esm.js is an ES module bundle that does not include Konva.js
  // and waveform-data.js dependencies
  {
    input: 'src/main.js',
    output: [
      {
        file: 'dist/peaks.esm.js',
        name: 'peaks',
        format: 'es'
      }
    ],
    plugins: [
      peerDepsExternal(),
      commonjs(),
      resolve({ browser: true }),
      babel({ babelHelpers: 'bundled' })
    ]
  },
  // dist/peaks.ext.js and dist/peaks.ext.min.js are UMD builds that do not
  // include Konva.js and waveform-data.js dependencies
  {
    input: 'src/main.js',
    output: [
      {
        file: 'dist/peaks.ext.js',
        name: 'peaks',
        format: 'umd',
        sourcemap: true,
        globals
      },
      {
        file: 'dist/peaks.ext.min.js',
        name: 'peaks',
        format: 'umd',
        sourcemap: true,
        globals,
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
