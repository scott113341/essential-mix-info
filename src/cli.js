#!/usr/bin/env node

import path from 'path';

import Episode from './index.js';

(async () => {
  const args = process.argv.slice(2);
  const episodeDir = path.resolve(process.cwd(), args[0]);
  const episode = new Episode(episodeDir);
  console.log(await episode.getXmlItem());
})();
