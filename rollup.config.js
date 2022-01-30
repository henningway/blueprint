import pkg from './package.json';
import filesize from 'rollup-plugin-filesize';
import terser from 'rollup-plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';

const isProduction = process.env.NODE_ENV === 'production';

const input = 'src/index.js';

const plugins = [nodeResolve(), filesize(), isProduction && terser.terser()];

export default [
    {
        input,
        output: {
            file: pkg.module,
            format: 'esm',
            sourcemap: true
        },
        plugins
    },
    {
        input,
        output: {
            file: pkg.main,
            format: 'cjs',
            sourcemap: true
        },
        plugins
    }
];
