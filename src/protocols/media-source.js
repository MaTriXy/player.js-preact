import Protocols from './protocols';

import MP4Box from 'mp4box';

// this doesn't quite work yet but could eventually be revived into another package. 
// or if you're reading this you could :-)

export default class MediaSourceProtocol {
	static NAME = 'mse';

	constructor (fetchResponse, playlistItem) {
		this.mediaSource = new MediaSource();
		this.url = URL.createObjectURL(this.mediaSource);

		this._url = fetchResponse.url;

		this.mime = fetchResponse.headers.get('content-type');

		this.mediaSource.addEventListener('sourceopen', this._onOpen);

	}

	_onOpen = async (event) => {
		let response = await fetch(this._url, { mode: 'cors' })

		let reader = response.body.getReader();
		let length = 0;

		let mp4box = MP4Box.createFile();

		let ready = false, buffer = [];

		mp4box.onReady = (info) => {
			console.log('mp4box is ready', info)

			this.sourceBuffer = event.target.addSourceBuffer(info.mime);

            mp4box.setSegmentOptions(info.tracks[0].id, this.sourceBuffer, {});

			let initSegs = mp4box.initializeSegmentation(); 

			this.sourceBuffer.appendBuffer(initSegs[0].buffer);
			ready = true;

			/* console.log('init seg', initSegs[0])
			mp4box.start(); */

		}

		let lastSampleNo = 0;

		mp4box.onSegment = (id, user, buffer, sampleNo, last) => {
			if (sampleNo <= lastSampleNo) return;

			lastSampleNo = sampleNo;
			this.sourceBuffer.appendBuffer(buffer);
		}

		while (true) {
			let { done, value } = await reader.read();

			value.buffer.fileStart = length;
			length += value.length;

			// hmm, this doesn't really work yet as mp4box sometimes requests a different next byte 
			console.log(length, mp4box.appendBuffer(value.buffer));
			buffer.push(value.buffer);

			await new Promise(resolve => setTimeout(resolve, 100));

			if (ready) {
				mp4box.flush();
				break;
			}
		}

		this.sourceBuffer.addEventListener('updateend', async () => {
			if (buffer.length) {
				this.sourceBuffer.appendBuffer(buffer.shift());
				return;
			}

			let { done, value } = await reader.read();

			if (done) {
				if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open') {
					// this.mediaSource.endOfStream();
				}
				return;
			}

			this.sourceBuffer.appendBuffer(value.buffer);
		})

		this.sourceBuffer.appendBuffer(buffer.shift());

	}
}

Protocols.register({
	name: 'mse'
}, MediaSourceProtocol);