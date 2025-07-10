// babel.config.cjs
module.exports = {
  presets: [
    // for Jest / Node:
    ['@babel/preset-env', { targets: { node: 'current' } }],
    // for your React JSX:
    '@babel/preset-react'
  ],
  plugins: [
    // allow import.meta syntax
    '@babel/plugin-syntax-import-meta'
  ]
};
