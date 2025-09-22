const path = require('path');
const webpack = require('webpack');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const common={
    mode:'development',
    resolve:{
        extensions:['.ts','.mts','.mjs','.js']
    },
    module:{
        rules:[
            {
                test:/\.tsx?$/,
                loader:'ts-loader',
                exclude:/node_modules/
            },
            {
                test:/\.css$/,
                use:['style-loader','css-loader']
            }
        ]
    }
};

module.exports=[
    {
        ...common,
        target:'web',
        entry:'./src/renderer.ts',
        output:{
            filename:'renderer.js',
            path:path.resolve(__dirname,'dist'),
            publicPath:'./dist/'
        },
        plugins: [
            new MonacoWebpackPlugin({
                languages: ['javascript', 'typescript', 'css', 'html', 'json']
            }),
            new webpack.ProvidePlugin({
                global:'globalThis'
            })
        ]
    }
]