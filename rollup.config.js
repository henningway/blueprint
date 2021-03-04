import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';

export default {
    input: 'src/index.js',
    output: {
        name: 'Blueprint',
        dir: 'dist',
        format: 'umd',
        sourcemap: true
    },
    plugins: [typescript(), terser({ format: { comments: false } }), filesize()]
};
