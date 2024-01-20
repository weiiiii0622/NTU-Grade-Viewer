const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { webpack, DefinePlugin } = require("webpack");

module.exports = merge(common, {
    devtool: "inline-source-map",
    mode: "development",
    plugins: [new DefinePlugin({ APP_URL: JSON.stringify(process.env.APP_URL_DEV) })],
});
