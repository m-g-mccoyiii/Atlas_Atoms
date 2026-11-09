'use strict';
// Copies the game and the shared core into ./stage so the packaged app is self-contained.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', '..', '..'), out = path.resolve(__dirname, '..', 'stage');
fs.rmSync(out, { recursive: true, force: true });
for (const rel of ['apps/steam/index.html', 'apps/steam/css', 'apps/steam/js', 'apps/steam/fonts', 'packages/core/js', 'packages/core/vendor']) {
  fs.cpSync(path.join(root, rel), path.join(out, rel), { recursive: true });
}
console.log('staged to', out);
