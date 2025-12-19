import esbuild from 'esbuild';
import { writeFileSync } from 'fs';

// Create entry point that re-exports what we need
const entryContent = `
export { identity, configure } from 'deso-protocol';
`;
writeFileSync('deso-entry.js', entryContent);

await esbuild.build({
  entryPoints: ['deso-entry.js'],
  bundle: true,
  format: 'esm',
  outfile: 'public/deso-protocol.js',
  platform: 'browser',
  target: 'es2020',
});

console.log('✓ DeSo SDK bundled to public/deso-protocol.js');
