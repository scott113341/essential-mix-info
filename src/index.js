import { promisify } from 'bluebird';
import fs from 'fs';
import musicMeta from 'musicmetadata';
import path from 'path';
import sh from 'shelljs';

export default class Episode {

  constructor (dir, overrides = {}) {
    this.path = path.resolve(dir);
    this.overrides = overrides;
    this.cache = new Cache();
  }

  async _getInfoContents () {
    return this.cache.get('info', async () => {
      const infoPath = (await this._fuzzyPaths('*.txt'))[0];
      const data = await promisify(fs.readFile)(infoPath);
      return data.toString('utf-16le');
    });
  }

  async _fuzzyPaths (fuzzy) {
    return this.cache.get(`fuzzy${fuzzy}`, () => {
      const glob = path.join(this.path, fuzzy);
      return sh.ls(glob);
    });
  }

  async getTitle () {
    const info = await this._getInfoContents();
    const regex = /[\d-]+\s+-\s+(.+?)\s+- Essential Mix/;
    const match = regex.exec(info)[1];
    return `${match} #${await this.getEpisode()}`;
  }

  async getEpisode () {
    const info = await this._getInfoContents();
    const regex = /^ESSENTIAL MIX EPISODE: (\d+)$/m;
    const match = regex.exec(info);
    return parseInt(match[1], 10);
  }

  async getUrl () {
    const episode = await this.getEpisode();
    return `http://s352287239.onlinehome.us/podcasts/essential-mix/media/${episode}.m4a`;
  }

  /**
   * Gets size of file in bytes.
   * @returns {Promise.<void>}
   */
  async getSize () {
    const audioPath = (await this._fuzzyPaths('*.m4a'))[0];
    const stats = await promisify(fs.stat)(audioPath);
    return stats.size;
  }

  /**
   * Returns duration in seconds.
   * @returns {Promise.<boolean|number|Number>}
   */
  async getDuration () {
    const audioPath = (await this._fuzzyPaths('*.m4a'))[0];
    const stream = fs.createReadStream(audioPath);
    const metadata = await promisify(musicMeta)(stream, { duration: true });
    return Math.round(metadata.duration);
  }

  async getDate () {
    const info = await this._getInfoContents();
    const regex = /(\d{4}-\d{2}-\d{2})/;
    return new Date(regex.exec(info)[1]);
  }

  async getXmlItem () {
    const date = await this.getDate();
    date.setUTCHours(23);
    date.setUTCMinutes(59);
    date.setUTCSeconds(59);

    let xml = '';
    xml += `\t<item>`;
    xml += `\n\t\t<title>${await this.getTitle()}</title>`;
    xml += `\n\t\t<enclosure url="${await this.getUrl()}" length="${await this.getSize()}" type="audio/mp4" />`;
    xml += `\n\t\t<itunes:duration>${await this.getDuration()}</itunes:duration>`;
    xml += `\n\t\t<pubDate>${date.toUTCString()}</pubDate>`;
    xml += `\n\t</item>`;
    return xml;
  }

}


class Cache {

  constructor () {
    this.cache = new Map();
  }

  async get (key, getValue) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    } else {
      const value = await getValue();
      this.cache.set(key, value);
      return value;
    }
  }

}
