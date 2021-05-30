import { babel } from '@rollup/plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

// import pkg from './package.json';

export default {
  input: `src/main.js`,
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
    // { file: pkg.module, format: 'es', sourcemap: true }
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    commonjs(),
    resolve({ browser: true }),
    babel({ babelHelpers: 'bundled' })
    // Resolve source maps to the original source
    // sourceMaps()
  ]
};
