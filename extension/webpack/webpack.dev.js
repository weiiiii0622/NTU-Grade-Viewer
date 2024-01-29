const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { webpack, DefinePlugin } = require("webpack");

const env = process.env;
const { PORT_DEV, HOST_DEV } = env;

module.exports = merge(common, {
    devtool: "inline-source-map",
    mode: "development",
    plugins: [new DefinePlugin({ APP_URL: JSON.stringify(`http://${HOST_DEV}:${PORT_DEV}`) })],
});
