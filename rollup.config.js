import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/main.js',
  output: [
    {
      file: 'peaks.js',
      name: 'peaks',
      format: 'umd',
      sourcemap: true,
      freeze: false
    },
    {
      file: 'peaks.min.js',
      name: 'peaks',
      format: 'umd',
      sourcemap: true,
      freeze: false,
      plugins: [
        terser()
      ]
    }
  ],
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    commonjs(),
    resolve({ browser: true }),
    babel({ babelHelpers: 'bundled' })
  ]
};
