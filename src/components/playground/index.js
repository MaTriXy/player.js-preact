import React from 'react';
import Player from '../player';

import style from './style.css';

export default class Playground extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			playlist: [
				{
					"id": "555",
					"type": "audio",
					"source": {
						"href": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // "https://scdnc.insanityradio.com/dash/hls/insanity/index.m3u8",
						"loader": "hls",
						"live": false,
						"DISABLEDrewind": {
							"enable": true,
							"duration": 600
						}
					}
				}
			]
		}

		this.state.editor = JSON.stringify(this.state.playlist, null, 4);
	}

	render () {
		return (
			<div className={ style.main }>
				<div className={ style.player }>
					<Player 
						mode="video"
						autoplay={ true }
						playlist={ this.state.playlist }
					/>
				</div>
				<div>
					<select onChange={ this._changePlaylist }>
						<option value="">Custom</option>

						<option value='[{"id":"1","type":"video","source":{"href":"https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"}}]'>Big Buck Bunny</option>

						<option value='[{"id":"2","type":"audio","source":{"href":"https://stream.cor.insanityradio.com/insanity320.mp3","live":true}}]'>Insanity Radio (Icecast)</option>
						<option value='[{"id":"3","type":"audio","source":{"href":"https://scdnc.insanityradio.com/dash/hls/insanity/index.m3u8","live":true,"rewind":{"enable":true,"duration":60}}}]'>Insanity Radio (HLS Audio)</option>

						<option value='[{"id":"4","type":"video","source":{"href":"https://scdnc.insanityradio.com/manifest/hls/video.m3u8","live":true,"rewind":{"enable":true,"duration":600}}}]'>Insanity Radio Viz (HLS)</option>
					</select>
					<textarea onChange={ this._changePlaylist }>
						{
							this.state.editor
						}
					</textarea>
				</div>
			</div>
		)
	}

	_changePlaylist = (event, value) => {
		value = value || event.target.value;

		this.setState({
			editor: value
		})

		try {
			value = JSON.parse(value)

			this.setState({
				playlist: value
			})
		} catch (e) {
		}
		
	}
}