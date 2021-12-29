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

	get tolerance () {
		let currentFrag = this.hls.streamController.fragPlaying;

		let currentTime = this.hls.media.currentTime - (currentFrag && currentFrag.start || 0);

		return currentTime;
	}

	get liveTotalTime () {
		return this.hls.liveSyncPosition;
	}

	get currentTime () {
		return this.hls.media.currentTime;
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
}

Protocols.register({
	name: 'hls',
	extension: 'm3u8'
}, HLSProtocol);