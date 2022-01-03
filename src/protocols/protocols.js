import Passthrough from './passthrough';

export default class Protocols {
	static contentTypes = {};
	static extensions = {};
	static loaders = {};

	static find (fetchResponse, playlistItem, media) {
		let contentType = fetchResponse.headers.get('content-type');
		let extension = fetchResponse.url.split('.').pop();

		if (this.loaders[playlistItem.source && playlistItem.source.loader]) {
			return new this.loaders[playlistItem.source.loader](fetchResponse, playlistItem, media);
		}

		if (this.contentTypes[contentType]) {
			return new this.contentTypes[contentType](fetchResponse, playlistItem, media);
		}

		if (this.extensions[extension]) {
			return new this.extensions[extension](fetchResponse, playlistItem, media);
		}

		return new Passthrough(fetchResponse, playlistItem, media);
	}

	static register (matches, handler) {
		if ('contentType' in matches) {
			this.contentTypes[matches.contentType] = handler;
		}

		if ('extension' in matches) {
			this.extensions[matches.extension] = handler;
		}

		if ('NAME' in handler) {
			this.loaders[handler.NAME] = handler;
		}
	}
}