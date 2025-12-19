import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['deso-protocol'],
  bundle: true,
  format: 'esm',
  outfile: 'public/deso-protocol.js',
  platform: 'browser',
  target: 'es2020',
});

console.log('✓ DeSo SDK bundled to public/deso-protocol.js');
