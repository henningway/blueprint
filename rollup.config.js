import filesize from 'rollup-plugin-filesize';

export default {
    input: 'src/index.js',
    output: {
        name: 'Blueprint',
        file: 'dist/index.js',
        format: 'umd'
    },
    plugins: [filesize()]
};
