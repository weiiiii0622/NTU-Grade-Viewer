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
      popup: path.join(srcDir, "popup.tsx"),
      options: path.join(srcDir, "options.tsx"),
      background: path.join(srcDir, "background.tsx"),
      content_script: path.join(srcDir, "content_script.tsx"),
      content_script_popup: path.join(srcDir, "content_script_popup.tsx"),
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
