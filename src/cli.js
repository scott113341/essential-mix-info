#!/usr/bin/env node

import minimist from 'minimist';
import path from 'path';

import Episode from './index.js';

(async () => {
  const args = minimist(process.argv.slice(2));
  const episodeDir = path.resolve(process.cwd(), args._[0]);
  const episode = new Episode(episodeDir, args);
  console.log(await episode.getXmlItem());
  await episode.makeCopy();
})();
