import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: './main.js',
  output: [
    {
      file: 'custom-markers.js',
      name: 'peaks',
      format: 'iife',
      sourcemap: true,
      freeze: false
    }
  ],
  external: [],
  plugins: [
    commonjs(),
    resolve({ browser: true }),
    babel({ babelHelpers: 'bundled' }),
  ]
};
