const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");

const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = process.env;
const { V2 } = env;

module.exports = {
   entry: {
      popup: path.join(srcDir, V2 ? "popup.tsx" : "popup_v2.tsx"),
      options: path.join(srcDir, "options.tsx"),
      background: path.join(srcDir, V2 ? "background_v2.tsx" : "background.tsx"),
      content_script: path.join(srcDir, V2 ? "content_script_v2.tsx" : "content_script.tsx"),
   },
   output: {
      path: path.join(__dirname, "../dist/js"),
      filename: "[name].js",
   },
   optimization: {
      splitChunks: {
         name: "vendor",
         chunks(chunk) {
            return chunk.name !== "background";
         },
      },
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            use: "ts-loader",
            exclude: /node_modules/,
         },
      ],
   },
   resolve: {
      extensions: [".ts", ".tsx", ".js"],
   },
   plugins: [
      new CopyPlugin({
         patterns: [
            {
               from: ".",
               to: "../",
               context: "public",
            },
         ],
      }),
   ],
   watchOptions: {
      //ignored: /node_modules/,
      poll: true,
   },
};
