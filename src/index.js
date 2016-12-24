import { promisify } from 'bluebird';
import fs from 'fs';
import musicMeta from 'musicmetadata';
import path from 'path';
import sh from 'shelljs';

export default class Episode {

  constructor (dir, overrides = {}) {
    this.path = path.resolve(dir);
    this.overrides = overrides; // title episode url size duration date
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
    if (this.overrides.title) return this.overrides.title;
    const info = await this._getInfoContents();
    const regex = /[\d-]+\s+-\s+(.+?)\s+- Essential Mix/;
    const match = regex.exec(info)[1];
    return `${match} #${await this.getEpisode()}`;
  }

  async getEpisode () {
    if (this.overrides.episode) return this.overrides.episode;
    const info = await this._getInfoContents();
    const regex = /^ESSENTIAL MIX EPISODE: (\d+)$/m;
    const match = regex.exec(info);
    return parseInt(match[1], 10);
  }

  async getUrl () {
    if (this.overrides.url) return this.overrides.url;
    const episode = await this.getEpisode();
    return `http://s352287239.onlinehome.us/podcasts/essential-mix/media/${episode}.m4a`;
  }

  /**
   * Gets size of file in bytes.
   * @returns {Promise.<void>}
   */
  async getSize () {
    if (this.overrides.size) return this.overrides.size;
    const audioPath = (await this._fuzzyPaths('*.m4a'))[0];
    const stats = await promisify(fs.stat)(audioPath);
    return stats.size;
  }

  /**
   * Returns duration in seconds.
   * @returns {Promise.<boolean|number|Number>}
   */
  async getDuration () {
    if (this.overrides.duration) return this.overrides.duration;
    const audioPath = (await this._fuzzyPaths('*.m4a'))[0];
    const stream = fs.createReadStream(audioPath);
    const metadata = await promisify(musicMeta)(stream, { duration: true });
    return Math.round(metadata.duration);
  }

  async getDate () {
    if (this.overrides.date) return this.overrides.date;
    const info = await this._getInfoContents();
    const regex = /(\d{4}-\d{2}-\d{2})/;
    return new Date(regex.exec(info)[1]);
  }

  async getXmlItem () {
    const date = await this.getDate();
    date.setUTCHours(23);
    date.setUTCMinutes(59);
    date.setUTCSeconds(59);

    const duration = await this.getDuration();
    const d = new Date(duration * 1000);
    const durationString = [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()].join(':');

    let xml = '';
    xml += `\t<item>`;
    xml += `\n\t\t<title>${await this.getTitle()}</title>`;
    xml += `\n\t\t<enclosure url="${await this.getUrl()}" length="${await this.getSize()}" type="audio/mp4" />`;
    xml += `\n\t\t<itunes:duration>${durationString}</itunes:duration>`;
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
