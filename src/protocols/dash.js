import Protocols from './protocols';
import DASHjs from 'dashjs';

console.log('dash', DASHjs)

export default class DASHProtocol {
	static NAME = 'dash';

	constructor (fetchResponse, playlistItem, media) {
		this.dash = new DASHjs.MediaPlayer().create();
		this.playlistItem = playlistItem;

		this._url = fetchResponse.url;

		this.dash.initialize(media, this._url, true);
		
	}

	destroy () {
		console.log('destroy adaptor')
		this.dash.destroy();
	}

	get tolerance () {
		//let currentFrag = this.dash.streamController.fragPlaying;

		//let currentTime = this.currentTime - (currentFrag && currentFrag.start || 0);

		return 10; // currentTime;
	}

	get liveTotalTime () {
		return this.dash.duration();
	}

	seek (value) {
		return this.dash.seek(value);
	}

	get currentTime () {
		return this.dash.time();
	}

	get adaptiveSets () {
		return this.dash.getBitrateInfoListFor(this.playlistItem.source.type || "video").map(this._mapLevel).sort((a, b) => b.key - a.key)
	}

	get adaptiveSet () {
		return this._mapLevel(this.dash.getQualityFor(this.playlistItem.source.type || "video"));
	}

	set adaptiveSet (value) {
		if (typeof value == 'object') {
			if (value.key) {
				this.dash.setQualityFor(this.playlistItem.source.type || "video", value.key, true);
			}
		}
	}

	get delay () {
		return this.dash.getCurrentLiveLatency();
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
	name: 'dash',
	extension: 'mpd'
}, DASHProtocol);