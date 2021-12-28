import React from 'react';
import Transport from '../transport';

import protocols from '../../protocols';

const PlaybackState = {
	NONE: 0,
	LOADING: 1,
	ERROR: 2,
	BUFFERING: 3,
	PLAYING: 4,
	PAUSED: 5
}

const PlaybackAction = {
	NONE: 0,
	PLAY: 4,
	PAUSE: 5
}

const DefaultPlaylistItem = {
	id: 'some_identifier',
	type: 'video',
	source: {
		href: 'https://cdn.index.hm/f/wlkX0zBjZTE2OWY5ZmEzN/39.mp4', // 'https://scdnc.insanityradio.com/dash/dash/insanity/index.mpd',
		live: false,
		/* rewind: {
			enabled: true,
			duration: 60
		} */
	}
}

/**
 * @ReactClass Player
 * 
 * @prop type 'audio' or 'video'
 * @prop style 
 * @prop autoplay
 * @prop playlist List (or single) source to play 
 * @prop theme A custom theme for transport controls
 */


export default class Player extends React.Component {
	state = {
		action: PlaybackAction.NONE,
		state: PlaybackState.NONE
	}

	constructor (props) {
		super(props);
	}

	componentDidMount () {
		window.addEventListener('fullscreenchange', this._fullScreenChange);
		this.load()
	}

	componentWillUnmount () {
		window.removeEventListener('fullscreenchange', this._fullScreenChange);
	}

	load (force) {
		let playlist = this.props.playlist;
		if (!Array.isArray(playlist)) playlist = [playlist];
		if (!playlist || !playlist.length) return;

		let target = playlist[0];

		// ok. did the current item finish playing? and is it in the current playlist? if so, target is next
		if (this.state.target && this.state.target.finished && playlist.find(s => s.id == this.state.target.id)) {
			let index = playlist.findIndex(s => s.id == this.state.target.id);

			if (index < playlist.length - 1) {
				target = playlist[index + 1];
			}
		}

		if (!force && this.state.target && this.state.target.id == target.id) {
			return;
		}

		this.setState({
			target
		}, () => this.loadSource())
	}

	async loadSource () {
		// ok, what is it?
		if (this.mediaRef) {
			delete this.mediaRef.src;
		}

		await this.setPlaybackState(PlaybackState.LOADING);

		let { target } = this.state;

		if (target.source.href) {
			// ok, let's take a lookie at it :-)

			let mediaFile = await fetch(
				target.source.href,
				{ mode: 'cors' }
			)

			console.log('got data response', mediaFile)

			let handler = protocols.find(mediaFile, target);

			console.log('got video handler', handler)

			if (handler.url) {
				this.mediaRef.src = handler.url;
			}

		}
	}

	play (gesture = true) {
		if (this.mediaRef) {
			this.mediaRef.play();
		}

		if (gesture) {
			this.setPlaybackAction(PlaybackAction.PLAY)
		}
	}

	pause (gesture = true) {
		if (this.mediaRef) {
			this.mediaRef.pause();
		}

		if (gesture) {
			this.setPlaybackAction(PlaybackAction.PAUSE)
		}
	}

	seek (currentTime) {
		this._seekTime = currentTime;

		if (this.mediaRef) {
			let ref = this.mediaRef;
			ref.currentTime = currentTime;

			this.dispatch('timeupdate', event, {
				time: currentTime,
				duration: Math.max(isNaN(ref.duration) ? 0 : ref.duration, 0.001),
				buffered: ref.buffered.length ? ref.buffered.end(0) : 0
			})
		}
	}

	dispatch (type, nativeEvent, props = {}) {
		switch (type) {
			case 'buffering': {
				this.setPlaybackState(PlaybackState.BUFFERING, nativeEvent, props)
				break;
			}
			case 'canplay': {
				this.setPlaybackState(PlaybackState.PAUSED, nativeEvent, props)

				if (this.props.autoplay && this.state.action != PlaybackAction.PAUSE) {
					this.play(false)
				}

				this._onTimeUpdate(nativeEvent);

				break;
			}
			case 'error': {
				this.setPlaybackState(PlaybackState.ERROR, nativeEvent, props);
				break;
			}
			case 'loadstart': {
				this.setPlaybackState(PlaybackState.LOADING, nativeEvent, props);

				this._onTimeUpdate(nativeEvent);

				break;
			}
			case 'play': {
				if (this.state.state == PlaybackState.PAUSED) {
					this.setPlaybackState(PlaybackState.PLAYING, nativeEvent, props);
				}

				break;
			}
			case 'playing': {
				this.setPlaybackState(PlaybackState.PLAYING, nativeEvent, props);
				break;
			}
			case 'pause': {
				this.setPlaybackState(PlaybackState.PAUSED, nativeEvent, props);
				break;
			}
			case 'ended': {
				this.setState(oldState => ({
					target: Object.assign({}, oldState.target, {
						finished: true
					})
				}), () => {
					console.log('ye load')
					this.load(true);
				})
			}

		}

		if (this._transportRef) {
			this._transportRef.dispatch(type, nativeEvent, props);
		}
	}

	setPlaybackState = (state, event, props) => {
		return new Promise(resolve => {
			this.setState({
				state
			}, () => {
				console.log('state', state)
				resolve();

				if (this.props.onStateUpdate) {
					this.props.onStateUpdate(state, event, props);
				}
			})
		})
	}

	setPlaybackAction = (action) => {
		this.setState({
			action
		})
	}

	render () {
		return (
			<div ref={ this._setRootRef } className="player-js_root" style={ this.props.style }>
				{
					this.renderPlayer()
				}
				{
					this.renderTransport()
				}
			</div>
		);
	}

	_setRootRef = (ref) => {
		this._rootRef = ref;
	}

	renderPlayer () {
		switch (this.state.mode || this.props.mode) {
			case 'audio':
				return (
					<audio style={{ display: 'none' }} ref={ this._setMediaRef } />
				)
			case 'video':
				return (
					<div className="player-js_video">
						<video ref={ this._setMediaRef } />
					</div>
				)
		}
	}

	_setTransportRef = (ref) => {
		this._transportRef = ref;
	}

	renderTransport () {
		return (
			<Transport
				state={ this.state.state }
				action={ this.state.action }
				ref={ this._setTransportRef }
				onPlay={ this._play }
				onPause={ this._pause }
				onSeek={ this._seek }
				onFullScreen={ this._fullScreen }
				fullScreen={ this.state.fullScreen }
				mediaRef={ this.mediaRef }
				volume={ this.mediaRef ? this.mediaRef.volume : 1}
				onChangeVolume={ this._onChangeVolume }
			></Transport>
		)
	}

	_onChangeVolume = (volume) => {
		console.log('sv', volume)
		if (this.mediaRef) {
			this.mediaRef.volume = volume;
		}

		this.setState({
			_volume: volume
		})
	}

	_setMediaRef = (ref) => {
		if (ref != this.mediaRef) {
			this.bindEvents(ref)
		}
		this.mediaRef = ref;
	}

	_fullScreen = () => {
		let success = this._rootRef.requestFullscreen();

		if (success) {
			this.setState({
				fullScreen: true
			})
		}
	}

	_fullScreenChange = () => {
		if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
			return;
		}

		this.setState({
			fullScreen: false
		})
	}

	bindEvents (ref) {
		if (this.mediaRef) {
			this.mediaRef.removeEventListener('buffering', this._onBuffering);
			this.mediaRef.removeEventListener('canplay', this._onCanPlay);
			this.mediaRef.removeEventListener('error', this._onError);
			this.mediaRef.removeEventListener('loadstart', this._onLoadStart);
			this.mediaRef.removeEventListener('pause', this._onPause);
			this.mediaRef.removeEventListener('play', this._onPlay);
			this.mediaRef.removeEventListener('playing', this._onPlaying);
			this.mediaRef.removeEventListener('timeupdate', this._onTimeUpdate);
			this.mediaRef.removeEventListener('progress', this._onTimeUpdate);
			this.mediaRef.removeEventListener('ended', this._onEnded);
		}

		if (ref) {
			ref.addEventListener('buffering', this._onBuffering);
			ref.addEventListener('canplay', this._onCanPlay);
			ref.addEventListener('error', this._onError);
			ref.addEventListener('loadstart', this._onLoadStart);
			ref.addEventListener('pause', this._onPause);
			ref.addEventListener('play', this._onPlay);
			ref.addEventListener('playing', this._onPlaying);
			ref.addEventListener('timeupdate', this._onTimeUpdate);
			ref.addEventListener('progress', this._onTimeUpdate);
			ref.addEventListener('ended', this._onEnded);
		}
	}

	_onBuffering = this.dispatch.bind(this, 'buffering');
	_onCanPlay = this.dispatch.bind(this, 'canplay');
	_onError = this.dispatch.bind(this, 'error');
	_onLoadStart = this.dispatch.bind(this, 'loadstart');
	_onPause = this.dispatch.bind(this, 'pause');
	_onPlaying = this.dispatch.bind(this, 'playing');
	_onPlay = this.dispatch.bind(this, 'play');
	_onTimeUpdate = (event) => {
		this.dispatch('timeupdate', event, {
			time: this._seeking ? this._seekTime : event.target.currentTime,
			duration: Math.max(isNaN(event.target.duration) ? 0 : event.target.duration, 0.001),
			buffered: event.target.buffered.length ? event.target.buffered.end(0) : 0
		})
	}

	_onEnded = this.dispatch.bind(this, 'ended');

	_play = this.play.bind(this);
	_pause = this.pause.bind(this);
	_seek = this.seek.bind(this);

}


Player.defaultProps = {
	mode: 'video',
	autoplay: false,
	playlist: [DefaultPlaylistItem]
}
