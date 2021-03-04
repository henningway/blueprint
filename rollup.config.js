import filesize from 'rollup-plugin-filesize';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.js',
    output: {
        name: 'Blueprint',
        file: 'dist/index.js',
        format: 'umd'
    },
    plugins: [filesize(), terser()]
};
