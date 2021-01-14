const path = require('path');

module.exports = {
    entry: './js/app.js',
    mode: "development",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js'
    },
    watch: true, //not sure if this works, comment it out when in doubt
};