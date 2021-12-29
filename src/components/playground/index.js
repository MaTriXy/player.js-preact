import React from 'react';
import Player from '../player';

import style from './style.css';

export default class Playground extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			playlist: /*[
				{
					id: '000',
					type: 'video',
					source: {
						href: 'https://cdn.index.hm/f/wikX0TYyYTRiZTY0NTg3O/Road+-+39810.mp4'
					}
				},
				{
					id: '001',
					type: 'video',
					source: {
						href: 'https://cdn.index.hm/f/wlkX0zBjZTE2OWY5ZmEzN/39.mp4'
					}
				},
				{
					id: '002',
					type: 'video',
					source: {
						href: 'https://cdn.index.hm/f/wkkX0zk1MjZlOGI3MWY5Y/17.mp4'
					}
				}
			]*/[
					{
						"id": "555",
						"type": "video",
						"source": {
							"href": "https://scdnc.insanityradio.com/manifest/hls/video.m3u8",
							"loader": "hls",
							"live": true,
							"rewind": {
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
						autoplay
						playlist={ this.state.playlist }
					/>
				</div>
				<textarea onChange={ this._changePlaylist }>
					{
						this.state.editor
					}
				</textarea>
			</div>
		)
	}

	_changePlaylist = (event) => {
		let value = event.target.value;

		this.setState({
			editor: value
		})

		try {
			value = JSON.parse(value)

			console.log('yee', value)
			this.setState({
				playlist: value
			})

		} catch (e) {
			console.log('aa', e)
		}
		
	}
}