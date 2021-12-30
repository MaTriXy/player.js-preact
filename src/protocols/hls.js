import Protocols from './protocols';
import HLSjs from 'hls.js';

export default class HLSProtocol {
	static NAME = 'hls';

	constructor (fetchResponse, playlistItem, media) {
		this.hls = new HLSjs();

		this._url = fetchResponse.url;

		this.hls.loadSource(this._url);

		this.hls.attachMedia(media)
		this.url = media.src;

		this.loading = new Promise((resolve) => {
			this.loading = null;

			let handler = async () => {
				// if (this.hls.media.readyState < 2) {
					// console.log('nope')
					// this.hls.once(HLSjs.Events.BUFFER_APPENDED, handler)
				// } else {

					try {
						await this.hls.media.play()
						await this.hls.media.pause()
					} catch (e) {

					}

					setTimeout(() => resolve(), 10);
				// }
			}

			this.hls.once(HLSjs.Events.BUFFER_APPENDED, handler)

			// resolve();
		})

		console.log('hls', this.hls)
	}

	destroy () {
		this.hls.destroy();
	}

	get tolerance () {
		return 0; 
	}

	get liveTotalTime () {
		return this.hls.liveSyncPosition;
	}

	get currentTime () {
		return this.hls.media.currentTime;
	}

	get adaptiveSets () {
		return this.hls.levels.map(this._mapLevel).sort((a, b) => b.key - a.key)
	}

	get adaptiveSet () {
		return this._mapLevel(this.hls.levels[this.hls.currentLevel]);
	}

	set adaptiveSet (value) {
		if (typeof value == 'object') {
			if (value.key) {
				let level = this.hls.levels.findIndex(l => l.bitrate == value.key)

				if (level >= 0) {
					this.hls.currentLevel = level;
				}
			}
		}
	}

	get delay () {
		return this.hls.targetLatency;
	}

	get src () {
		return this.url;
	}

	set src (url) {
		this.url = url;
	}

	_mapLevel = level => (level ? {
		key: level.bitrate,
		text: (level.height ? level.height + 'p' : (level.bitrate / 1024 / 1024).toFixed(1) + ' Mbps')
	} : { key: 0, text: '-' })
}

Protocols.register({
	name: 'hls',
	extension: 'm3u8'
}, HLSProtocol);