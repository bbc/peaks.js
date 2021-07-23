import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

import path from 'path';

export default {
  input: './src/main.js',
  output: [
    {
      file: './dist/peaks.js',
      name: 'peaks',
      format: 'umd',
      sourcemap: true,
      freeze: false
    },
    {
      file: './dist/peaks.min.js',
      name: 'peaks',
      format: 'umd',
      sourcemap: true,
      freeze: false,
      plugins: [
        terser()
      ]
    },
    {
      file: './dist/peaks.esm.js',
      name: 'peaks',
      format: 'esm',
      sourcemap: true,
      freeze: false,
      plugins: [
        terser()
      ]
    }
  ],
  // eslint-disable-next-line
  // https://github.com/formium/tsdx/blob/462af2d002987f985695b98400e0344b8f2754b7/src/createRollupConfig.ts#L63
  external: (id) => {
    // bundle in polyfills as TSDX can't (yet) ensure they're installed as deps
    if (id.startsWith('regenerator-runtime')) {
      return false;
    }

    return !id.startsWith('.') && !path.isAbsolute(id);
  },
  watch: {
    include: 'src/**'
  },
  plugins: [
    commonjs(),
    resolve({ browser: true }),
    babel({ babelHelpers: 'bundled' })
  ]
};
