import 'source-map-support/register';

import path from 'path';
import test from 'tape';

import Episode from '../index.js';

function makeEpisode (overrides) {
  const dir = path.resolve(__dirname, 'fixtures', '2016-11-05 - Recondite - Essential Mix');
  return new Episode(dir, overrides);
}

test('_getInfoContents', async t => {
  const episode = makeEpisode();
  const contents = await episode._getInfoContents();
  t.ok(contents.length > 500);
  t.end();
});

test('getTitle', async t => {
  const episode = makeEpisode();
  t.equal(await episode.getTitle(), 'Recondite #1187');
  t.end();
});

test('getEpisode', async t => {
  const episode = makeEpisode();
  t.equal(await episode.getEpisode(), 1187);
  t.end();
});

test('getUrl', async t => {
  const episode = makeEpisode();
  t.equal(await episode.getUrl(), 'http://s352287239.onlinehome.us/podcasts/essential-mix/media/1187.m4a');
  t.end();
});

test('getDuration', async t => {
  const episode = makeEpisode();
  t.equal(await episode.getDuration(), 7192);
  t.end();
});

test('getSize', async t => {
  const episode = makeEpisode();
  t.equal(await episode.getSize(), 289264556);
  t.end();
});

test('getDate', async t => {
  const episode = makeEpisode();
  t.deepEqual(await episode.getDate(), new Date('2016-11-05'));
  t.end();
});

test('getXmlItem', async t => {
  const episode = makeEpisode();
  console.log(await episode.getXmlItem());
  t.end();
});
