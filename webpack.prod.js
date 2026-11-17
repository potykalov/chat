import common from "./webpack.common.js";
import TerserPlugin from "terser-webpack-plugin";
import { merge } from "webpack-merge";

export default merge(common, {
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({})],
  },
});
