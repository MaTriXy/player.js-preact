import Passthrough from './passthrough';
import MediaSource from './media-source';

export default class Protocols {
	static contentTypes = {};
	static extensions = {};

	static find (fetchResponse, playlistItem) {
		let contentType = fetchResponse.headers.get('content-type');
		let extension = fetchResponse.url.split('.').pop();

		if (this.contentTypes[contentType]) {
			return new this.contentTypes[contentType](fetchResponse, playlistItem);
		}

		if (this.extensions[extension]) {
			return new this.extensions[extension](fetchResponse, playlistItem);
		}

		return new Passthrough(fetchResponse, playlistItem);
	}

	static register (contentType, handler) {
	}
}