export default class MediaSource {
	constructor (fetchResponse, playlistItem) {
		this.mediaSource = new MediaSource();
		this.url = URL.createObjectURL(mediaSource);

		this.mediaSource.addEventListener('sourceopen', this._onOpen);
	}

	_onOpen = () => {

	}
}