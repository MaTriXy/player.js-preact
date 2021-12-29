import React from 'react';
import Lottie from "lottie-react";
import SeekBar from './seek-bar';
import { PlaybackState, PlaybackAction } from '../../constants';

import playPause from './icons/playPause.json';
import mute from './icons/mute.json';
import fullscreen from './icons/fullscreen.json';


const _dontPropagateUp = (e) => {
	e.stopPropagation();
}

class StatefulButton extends React.Component {
	constructor (props) {
		super(props)

		let _this = this;

		this._lottieRef = {
			get current() {
				return this._current
			},
			set current(value) {
				this._current = value
				_this.componentDidMount();
			}
		}
	}

	// hack! for some reason lottie doesn't like being re-rendered
	// ok..
	shouldComponentUpdate (nextProps, nextState) {

		if (nextProps.checked != this.props.checked) {
			if (this._lottieRef.current) {
				let lottie = this._lottieRef.current;
				let checked = nextProps.checked;
				lottie.setSpeed(this.props.speed || 1);
				lottie.setDirection(checked ? 1 : -1 );
				lottie.play();

			}
		}

		return false;
	}

	componentDidMount () {
		// lottie is slow as shit to mount..

		if (this._lottieRef.current) {
			this._lottieRef.current.goToAndPlay(this.props.checked ? this.props.onState : 1, true);
		}
	}

	nativeProps = ['onClick', 'onMouseMove', 'onMouseDown', 'onMouseUp', 'onMouseLeave'];

	render () {
		let nativeProps = Object.fromEntries(Object.entries(this.props).filter(([k, v]) => this.nativeProps.includes(k)))

		return (
			<button {...nativeProps} className={ "player-js_transport_button " + (this.props.className || '') } key={ 0 }>
				<Lottie
					key={ 1 }
					autoplay={ false }
					loop={ false }
					lottieRef={ this._lottieRef }
					initialSegment={ [1, this.props.onState] }
					style={{ height: '24px', fill: 'currentColor' }}
					animationData={ this.props.animationData }
				/>
			</button>
		)
	}
}

class VolumeSlider extends React.Component {
	render () {
		return (
			<div className="player-js_volume_slider" ref={ this._setHitArea } onClick={ this._seekTo } onMouseDown={ this._onSeekStart } onMouseMove={ this._onSeekMove } onMouseUp={ this._onSeekEnd }>
				<div className="player-js_volume_hit">
					<div className="player-js_volume_base">

						<div className="player-js_volume_current" style={{ width: (100 * this.props.volume) + '%' }}>
							<div className="player-js_volume_scrub">
							</div>
						</div>

					</div>

				</div>
			</div>
		)
	}

	_setHitArea = (ref) => {
		this._hitArea = ref;
	}

	_onSeekStart = (e) => {
		// e.preventDefault()
		window.addEventListener('mouseup', this._onSeekEnd)
		window.addEventListener('mousemove', this._onSeekMove)

		this.setState({
			seeking: true
		})
	}

	_getVolumeFromClick (e) {
		let rect = this._hitArea.getBoundingClientRect()
		let width = rect.width - 10;
		let x = Math.min(Math.max(e.pageX - rect.left - 6, 0), width);

		return x / width;
	}

	_onSeekEnd = (e) => {
		this.setState({
			seeking: false
		})

		if (document.activeElement.classList.contains('player-js_volume_contain')) {
			document.activeElement.blur();
		}

		window.removeEventListener('mouseup', this._onSeekEnd)
		window.removeEventListener('mousemove', this._onSeekMove)
	}

	_onSeekMove = (e) => {
		if (!this.state.seeking) return;

		let volume = this._getVolumeFromClick(e);

		this.props.onChange(volume);
	}

	_seekTo = (e) => {
		let volume = this._getVolumeFromClick(e);

		this.props.onChange(volume);
	}
}

export default class Transport extends React.Component {

	state = {
		hidden: false
	}

	dispatch (type, nativeEvent, props = {}) {
		if (type == 'timeupdate') {
			this.setState({
				currentTime: props.time,
				bufferedTime: props.buffered,
				totalTime: props.duration,
			})
		}
	}

	componentDidUpdate (prevProps, prevState) {
		if (prevProps.state != PlaybackState.PLAYING && this.props.state == PlaybackState.PLAYING) {
			this._resetTransportHideTimer()
		}

		if (this.state.hidden && this.props.state != PlaybackState.PLAYING) {
			this._showTransport()
		}

		if (prevProps.action != this.props.action && this.props.action) {
			if (this._actionRef) {
				let pos = (
					this.props.action == PlaybackAction.REWIND_5
						? { left: '15%' }
						: this.props.action == PlaybackAction.FORWARD_5
							? { left: '85%' } : {}
				);

				this._actionRef.animate([
					{ transform: 'scale(0.5)', opacity: 0, ...pos },
					{ transform: 'scale(1)', opacity: 0.7, ...pos },
					{ transform: 'scale(1.5)', opacity: 0.7, ...pos },
					{ transform: 'scale(2.0)', opacity: 0, ...pos}
				], {
					duration: 400,
					iterations: 1
				})
			}
		}
	}

	_resetTransportHideTimer = () => {
		clearTimeout(this._transportHideTimer)

		this._transportHideTimer = setTimeout(() => {
			this.setState({
				hidden: true
			})
		}, 1000)
	}

	_resetTimerFast = () => {
		clearTimeout(this._transportHideTimer)

		this._transportHideTimer = setTimeout(() => {
			this.setState({
				hidden: true
			})
		}, 100)
	}

	_showAndResetTimer = () => {
		if (this.props.state == PlaybackState.PLAYING) {
			clearTimeout(this._transportHideTimer)

			this._showTransport()
			this._resetTransportHideTimer();
		}
	}

	_showTransport = () => {
		this.setState({
			hidden: false
		})
	}

	renderTime = (time) => {
		if (!Number.isFinite(time)) {
			return '--:--';
		}

		let timeStamp = new Date(1000 * (isNaN(time) ? 0 : time)).toISOString().slice(11, 19);

		if (timeStamp.length > 5 && timeStamp.startsWith('00:')) {
			return timeStamp.slice(3)
		}

		return timeStamp;
	}

	render () {
		return (
			<div className="player-js_transport_contain" onMouseMove={ this._showAndResetTimer } onMouseLeave={ this._resetTimerFast } onClick={ this._playPause }>
				<div className="player-js_transport_controls_gradient" onClick={ _dontPropagateUp }>
				</div>
				<div className={ "player-js_transport" + (this.state.hidden ? " player-js_transport_hide" : "") } onClick={ _dontPropagateUp }>
					<div className="player-js_seek">
						<SeekBar
							state={ this.props.state }
							handler={ this.props.handler }
							disabled={ this.props.target && this.props.target.source.live && !this.props.target.source.rewind.enable }
							currentTime={ this.state.currentTime }
							bufferedTime={ this.state.bufferedTime }
							totalTime={ this.state.totalTime }
							onSeek={ this.props.onSeek }
							onPause={ this.props.onPause }
							onPlay={ this.props.onPlay }
							mediaRef={ this.props.mediaRef }
							rewind={ this.props.target && this.props.target.source.rewind }
						/>
					</div>

					<div className="player-js_controls">
						<div className="player-js_left_controls">
							<StatefulButton
								title="Play"
								animationData={ playPause }
								onState={ 8 }
								speed={ 2 }
								onClick={ this._playPause }
								checked={ this.getPlayIconState() } />

							<StatefulButton
								title="Mute"
								animationData={ mute }
								className="mute_btn"
								onState={ 14 }
								speed={ 2 }
								onClick={ this._toggleMute }
								onMouseMove={ this._showVolume }
								onMouseLeave={ this._hideVolume }
								checked={ this.getPlayIconState() } />

							<div className={ "player-js_volume_contain" + (this.state.volume ? " player-js_volume_visible" : "") } tabIndex={ 0 }>
								<VolumeSlider volume={ this.props.volume } onChange={ this.props.onChangeVolume } />
							</div>
						</div>

						<div className="player-js_time">
							{
								this.props.target && this.props.target.source.live ?
									<span className="player-js_time_units player-js_time_live"><span>LIVE</span></span>
								:
									<span className="player-js_time_units">
										<span>{ this.renderTime(this.state.currentTime) }</span>
										<span> / </span>
										<span>{ this.renderTime(this.state.totalTime) }</span>
									</span>
							}
						</div>

						<div className="player-js_right_controls">
							{ /* <button className="player-js_transport_button" onClick={ this.props.onFullScreen }>
								<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20px" height="20px"><path d="M 3 3 L 3 9 L 5 9 L 5 5 L 9 5 L 9 3 L 3 3 z M 15 3 L 15 5 L 19 5 L 19 9 L 21 9 L 21 3 L 15 3 z M 3 15 L 3 21 L 9 21 L 9 19 L 5 19 L 5 15 L 3 15 z M 19 15 L 19 19 L 15 19 L 15 21 L 21 21 L 21 15 L 19 15 z"/></svg>
							</button> */ }

							<StatefulButton
								title="Full Screen"
								animationData={ fullscreen }
								onState={ 14 }
								speed={ 2 }
								onClick={ this.props.onFullScreen }
								checked={ this.props.fullScreen } />
						</div>
					</div>
				</div>

				<div className="player-js_foreground_fx">
					<div className="player-js_foreground_state_change" ref={ this._setActionRef }>
						{
							this.renderAction()
						}
					</div>
				</div>
			</div>
		)
	}

	_toggleMute = () => {
		this.props.onChangeVolume(null);
	}

	_showVolume = () => {
		this.setState({
			volume: true
		})
	}

	_hideVolume = () => {
		this.setState({
			volume: false
		})
	}

	_playPause = () => {
		this.props.onPlayPause(true);
	}

	getPlayIconState () {
		if (this.props.state == PlaybackState.LOADING && !this.props.action) {
			return true;
		}

		switch (this.props.state) {
			case PlaybackState.PLAYING:
			case PlaybackState.BUFFERING:
			case PlaybackState.LOADING:
				return false;

			default:
				return true;
		}
	}

	renderAction () {
		switch (this.props.action) {
			case PlaybackAction.PLAY:
				return <svg key="s" fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px"><path d="M8,5v14l11-7L8,5z"/></svg>;

			case PlaybackAction.PAUSE:
				return <svg key="s" fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px"><path d="M 6 5 L 6 19 L 10 19 L 10 5 L 6 5 z M 14 5 L 14 19 L 18 19 L 18 5 L 14 5 z"/></svg>;

			case PlaybackAction.REWIND_5:
				return <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px"><path d="M 11 6 L 2.5 12 L 11 18 L 11 6 z M 20 6 L 11.5 12 L 20 18 L 20 6 z"/></svg>;

			case PlaybackAction.FORWARD_5:
				return <svg key="s" fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px"><path d="M 4 6 L 4 18 L 12.5 12 L 4 6 z M 13 6 L 13 18 L 21.5 12 L 13 6 z"/></svg>;

			case PlaybackAction.VOLUME_UP:
				return <svg key="s" fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px"><path d="M 11 3 L 5 9 L 3 9 C 1.895 9 1 9.895 1 11 L 1 13 C 1 14.105 1.895 15 3 15 L 5 15 L 11 21 L 11 3 z M 19.484375 3.515625 L 18.070312 4.9296875 C 21.984175 8.8435492 21.984042 15.157495 18.070312 19.070312 L 19.484375 20.484375 C 24.162647 15.807192 24.162513 8.1937633 19.484375 3.515625 z M 16.65625 6.34375 L 15.242188 7.7578125 C 17.594098 10.109723 17.593888 13.891346 15.242188 16.242188 L 16.65625 17.65625 C 19.772549 14.541091 19.772339 9.4598394 16.65625 6.34375 z M 13.828125 9.171875 L 12.414062 10.585938 C 13.204152 11.376027 13.204152 12.623974 12.414062 13.414062 L 13.828125 14.830078 C 15.382035 13.276168 15.382035 10.725785 13.828125 9.171875 z"/></svg>;

			case PlaybackAction.VOLUME_DOWN:
				return <svg key="s" fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px"><path d="M 12 3 L 6 9 L 2 9 L 2 15 L 6 15 L 12 21 Z M 14 8.09375 L 14 15.8125 C 15.699219 15.414063 17 13.898438 17 12 C 17 10.101563 15.699219 8.59375 14 8.09375 Z"/></svg>;
		}
	}

	getPlayIconAction () {
		switch (this.props.action) {
			case PlaybackState.PLAY:
				return false;

			default:
				return true;
		}
	}

	_setActionRef = (ref) => {
		this._actionRef = ref;
	}
}