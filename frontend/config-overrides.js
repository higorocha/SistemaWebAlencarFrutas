const AntdMomentWebpackPlugin = require('@ant-design/moment-webpack-plugin');
const { override, addWebpackPlugin } = require('customize-cra');

module.exports = override(
  addWebpackPlugin(new AntdMomentWebpackPlugin())
);
