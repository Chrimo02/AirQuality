// babel.config.cjs
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' } // für Jest & moderne Node-Versionen
      }
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic' // React 17+ JSX Transform
      }
    ]
  ]
  // Keine Jest-Optionen hier!
};
