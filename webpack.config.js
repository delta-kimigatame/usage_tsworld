const path = require("path");

module.exports = {
  entry: {
    index: "./src/index.ts",
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
    library: {
      name: "usage_tsworld",
      type: "var",
    },
  },
  resolve: {
    fallback: { buffer: false },
    extensions: [".ts", ".js", ".wasm"],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
      publicPath: "/",
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
      },
      {
        test: /\.wasm$/,
        type: "asset/resource", // ここでfile-loaderではなく、asset/resourceを使用
        generator: {
          filename: "[name].[hash][ext]", // 生成されるファイル名を設定
        },
      },
    ],
  },
};