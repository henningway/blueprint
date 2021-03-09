import filesize from 'rollup-plugin-filesize';

const isProduction = process.env.NODE_ENV === 'production';

export default (async () => ({
    input: 'src/index.js',
    output: {
        name: 'Blueprint',
        file: 'dist/index.js',
        format: 'umd'
    },
    plugins: [filesize(), isProduction && (await import('rollup-plugin-terser')).terser()]
}))();
