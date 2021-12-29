import React from 'react';

import Transport from '../transport';
import protocols from '../../protocols';

import { PlaybackState, PlaybackAction } from '../../constants';


const DefaultPlaylistItem = {
	id: 'some_identifier',
	type: 'audio',
	source: {
		href: 'https://stream.cor.insanityradio.com/insanity320.mp3?' + Date.now(), // 'https://scdnc.insanityradio.com/dash/dash/insanity/index.mpd',
		live: true,
		rewind: {
			enabled: false,
			tolerance: 2,
			duration: 30
		}
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

		window._player = this;
	}

	componentDidMount () {
		window.addEventListener('fullscreenchange', this._fullScreenChange);
		window.addEventListener('keydown', this._handleKeyPress);
		this.load()
	}

	componentWillUnmount () {
		window.removeEventListener('fullscreenchange', this._fullScreenChange);
		window.removeEventListener('keydown', this._handleKeyPress);
	}

	componentDidUpdate (prevProps, prevState) {
		if (prevProps.playlist != this.props.playlist) {
			if (!this.props.playlist.find(s => s.id == this.state.target.id)) {
				this.load();
			}
		}
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

		if (!force && this.state.target && this.state.target.id === target.id) {
			return;
		}

		let targetClone = Object.assign({}, target)

		this.setState({
			target: Object.assign(target, { source: {} }, targetClone)
		}, () => this.loadSource())
	}

	async loadSource () {
		// ok, what is it?
		if (this.mediaRef) {
			this.mediaRef.removeAttribute('src');
			this.mediaRef.load();
		}

		await this.setPlaybackState(PlaybackState.LOADING);

		let { target } = this.state;

		if (target.source.href) {
			// ok, let's take a lookie at it :-)

			let mediaFile = await fetch(
				target.source.href,
				{ mode: 'cors', method: 'HEAD' }
			)

			console.log('got data response', mediaFile)

			let handler = protocols.find(mediaFile, target, this.mediaRef);

			console.log('got video handler', handler)

			if (handler.url && this.mediaRef.src != handler.url) {
				this.mediaRef.src = handler.url;
			}

			if (handler.loading) {
				await handler.loading;
			}

			console.log('handler loaded')

			this.setState({
				handler
			}, () => {
				/* if () {
					this.play(false);
				} */

				if (this.props.autoplay && this.state.action != PlaybackAction.PAUSE) {

					if (!this.state.handler) {
						this._playWhenReady = true;
						return;
					}

					this.play(false)
				}
			})

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

	seekRelative (change) {
		console.log('seeks to', this.mediaRef.currentTime + change)
		this.seek(this.mediaRef.currentTime + change);
	}

	dispatch (type, nativeEvent, props = {}) {
		switch (type) {
			case 'buffering': {
				console.log('buffering')
				this.setPlaybackState(PlaybackState.BUFFERING, nativeEvent, props)
				break;
			}
			case 'canplay': {
				console.log('canplay')
				this.setPlaybackState(PlaybackState.PAUSED, nativeEvent, props)


				this._onTimeUpdate(nativeEvent);

				break;
			}
			case 'error': {
				this.setPlaybackState(PlaybackState.ERROR, nativeEvent, props);
				break;
			}
			case 'loadstart': {
				console.log('loadstart')
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
		if (action == this.state.action) {
			return this.setState({
				action: null
			}, () => this.setState({
				action
			}));
		}
		this.setState({
			action
		})
	}

	render () {
		return (
			<div ref={ this._setRootRef } tabIndex={ 0 } className="player-js_root" style={ this.props.style }>
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
				handler={ this.state.handler }
				target={ this.state.target }
				ref={ this._setTransportRef }
				onPlay={ this._play }
				onPause={ this._pause }
				onPlayPause={ this._playPause }
				onSeek={ this._seek }
				onFullScreen={ this._fullScreen }
				fullScreen={ this.state.fullScreen }
				mediaRef={ this.mediaRef }
				volume={ this.mediaRef ? this.mediaRef.volume : 1}
				onChangeVolume={ this._onChangeVolume }
			></Transport>
		)
	}

	_playPause = (gesture = true) => {
		if (this.state.state == PlaybackState.PLAYING) {
			this._pause(gesture);
		} else {
			this._play(gesture);
		}
	}

	_onChangeVolume = (volume) => {
		let curVolume = this.mediaRef ? this.mediaRef.volume : this.state._volume;

		if (volume === null) {
			// mute request
			if (curVolume == 0) {
				volume = this._lastVolume || 1;
			} else {
				this._lastVolume = curVolume;
				volume = 0;
			}
		} else {
			this._lastVolume = volume;
		}

		volume = Math.max(Math.min(volume, 1), 0);

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
		if (this.state.fullScreen) {
			document.exitFullscreen();
			return;
		}

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

	_handleKeyPress = (event) => {
		let _document = this.props.document || window.document;

		if (!this._rootRef.contains(_document.activeElement)) {
			return;
		}

		console.log('handle key press', event.keyCode, event.keyCode == 37)

		switch (event.keyCode) {
			case 32:
				this._playPause(true);
				return event.preventDefault();

			case 37:
				this.seekRelative(-5);
				this.setPlaybackAction(PlaybackAction.REWIND_5);
				return event.preventDefault();

			case 39:
				this.seekRelative(5);
				this.setPlaybackAction(PlaybackAction.FORWARD_5);
				return event.preventDefault();

			case 38:
				this._onChangeVolume((this.mediaRef ? this.mediaRef.volume : this.state._volume) + 0.1);
				this.setPlaybackAction(PlaybackAction.VOLUME_UP);
				return event.preventDefault();

			case 40:
				this._onChangeVolume((this.mediaRef ? this.mediaRef.volume : this.state._volume) - 0.1);
				this.setPlaybackAction(PlaybackAction.VOLUME_DOWN);
				return event.preventDefault();

			case 70:
				this._fullScreen();
				return event.preventDefault();

			case 77:
				this._onChangeVolume(null);
				return event.preventDefault();


			default:
				break;
		}

	}

}


Player.defaultProps = {
	mode: 'video',
	autoplay: true,
	playlist: [DefaultPlaylistItem]
}
