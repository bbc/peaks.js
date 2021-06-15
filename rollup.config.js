const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');

module.exports = {
  input: 'src/main.js',
  output: {
    file: 'peaks.js',
    format: 'umd',
    name: 'peaks'
  },
  plugins: [nodeResolve(), commonjs(), json()]
};
