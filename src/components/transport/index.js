import React from 'react';
import Lottie from "lottie-react";
import SeekBar from './seek-bar';
import { PlaybackState, PlaybackAction } from '../../constants';

import HeightAsProp from './height-as-prop';

import playPause from './icons/playPause.json';
import mute from './icons/mute.json';
import fullscreen from './icons/fullscreen.json';
import settings from './icons/settings.json';

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
			this._lottieRef.current.goToAndStop(this.props.checked ? this.props.onState : this.props.offState, true);
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
					initialSegment={ [this.props.offState, this.props.onState] }
					style={{ height: '24px', fill: 'currentColor' }}
					animationData={ this.props.animationData }
				/>
			</button>
		)
	}
}

StatefulButton.defaultProps = {
	offState: 1
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

				this._showTransport();

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
				<div className={ "player-js_transport" + (this.state.hidden && !this.state.settings ? " player-js_transport_hide" : "") } onClick={ _dontPropagateUp }>
					<div className="player-js_seek">
						<SeekBar
							state={ this.props.state }
							driver={ this.props.driver }
							disabled={ this.props.target && this.props.target.source.live && (!this.props.target.source.rewind || !this.props.target.source.rewind.enable) }
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

							{ /* <StatefulButton
								title="Mute"
								animationData={ mute }
								className="mute_btn"
								onState={ 14 }
								speed={ 2 }
								onClick={ this._toggleMute }
								onMouseMove={ this._showVolume }
								onMouseLeave={ this._hideVolume }
								checked={ this.props.volume == 0 } /> */ }

							<button
								className={ "player-js_transport_button mute_btn" } 
								title="Mute"
								onClick={ this._toggleMute }
								onMouseMove={ this._showVolume }
								onMouseLeave={ this._hideVolume }
							>
								{
									this.props.volume > 0.5 ?
										/*<svg key="s" fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px"><path d="M 11 3 L 5 9 L 3 9 C 1.895 9 1 9.895 1 11 L 1 13 C 1 14.105 1.895 15 3 15 L 5 15 L 11 21 L 11 3 z M 19.484375 3.515625 L 18.070312 4.9296875 C 21.984175 8.8435492 21.984042 15.157495 18.070312 19.070312 L 19.484375 20.484375 C 24.162647 15.807192 24.162513 8.1937633 19.484375 3.515625 z M 16.65625 6.34375 L 15.242188 7.7578125 C 17.594098 10.109723 17.593888 13.891346 15.242188 16.242188 L 16.65625 17.65625 C 19.772549 14.541091 19.772339 9.4598394 16.65625 6.34375 z M 13.828125 9.171875 L 12.414062 10.585938 C 13.204152 11.376027 13.204152 12.623974 12.414062 13.414062 L 13.828125 14.830078 C 15.382035 13.276168 15.382035 10.725785 13.828125 9.171875 z"/></svg>*/
										<svg height="24px" width="24px" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="c"><rect width="24" height="24"/></clipPath><filter id="a" x="0%" y="0%" width="100%" height="100%"><feComponentTransfer in="SourceGraphic"><feFuncA tableValues="1.0 0.0" type="table"/></feComponentTransfer></filter><mask id="b" mask-type="alpha"><g filter="url(#a)"><rect width="24" height="24" opacity="0"/><g transform="translate(-17.512 -17.528)" display="none"><g transform="translate(12.707 11.293)"><path d="m-10.512-10.512 21.024 21.024" fillOpacity="0" stroke="#ffd110" strokeMiterlimit="10" strokeWidth="3.9"/></g></g></g></mask></defs><g clipPath="url(#c)"><g display="block"><g transform="translate(12 12)"><path d="m0 0" fillOpacity="0" stroke="#000" strokeMiterlimit="10" strokeWidth="2"/></g></g><g display="block" mask="url(#b)"><g><g transform="translate(12 12)"><path d="m-6-3h-4v6h4l6 6v-18l-6 6zm8-5.9v2c3.4 0.5 6 3.4 6 6.9s-2.6 6.4-6 6.9v2c4.5-0.5 8-4.3 8-8.9s-3.5-8.4-8-8.9z"/></g><g transform="translate(16 12)"><path d="m2 0c0-2.4-1.7-4.4-4-4.9v2.1c1.2 0.4 2 1.5 2 2.8s-0.8 2.4-2 2.8v2.1c2.3-0.5 4-2.5 4-4.9z"/></g><g transform="translate(18 12)" opacity="0"><path d="m-4-8.9v2c3.4 0.5 6 3.4 6 6.9s-2.6 6.4-6 6.9v2c4.5-0.5 8-4.3 8-8.9s-3.5-8.4-8-8.9z"/></g></g></g></g></svg>
									: this.props.volume > 0 ?
										<svg key="s" fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px"><path d="M 12 3 L 6 9 L 2 9 L 2 15 L 6 15 L 12 21 Z M 14 8.09375 L 14 15.8125 C 15.699219 15.414063 17 13.898438 17 12 C 17 10.101563 15.699219 8.59375 14 8.09375 Z"/></svg>
									: 
										<svg key="s" fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px">    <path d="M 12 3 L 6 9 L 2 9 L 2 15 L 6 15 L 12 21 L 12 3 z M 15.707031 8.2929688 L 14.292969 9.7070312 L 16.585938 12 L 14.292969 14.292969 L 15.707031 15.707031 L 18 13.414062 L 20.292969 15.707031 L 21.707031 14.292969 L 19.414062 12 L 21.707031 9.7070312 L 20.292969 8.2929688 L 18 10.585938 L 15.707031 8.2929688 z"/></svg>
								}
							</button>


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

						<HeightAsProp as="div" componentRef={ this._setSettingsRef } className={ "player-js_settings_overlay" + (this.state.settings ? " player-js_settings_open" : "") } tabIndex={ 0 } onBlur={ this._hideSettings }>
							<div className="player-js_settings_content">
								{
									this.renderSettings()
								}
							</div>
						</HeightAsProp>

						<div className="player-js_right_controls">
							<StatefulButton
								title="Settings"
								animationData={ settings }
								onState={ 13 }
								offState={ 9 }
								speed={ 1 }
								onClick={ this._toggleSettings }
								checked={ this.state.settings } />

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

	_setSettingsRef = (ref) => {
		this._settingsRef = ref;
	}

	_hideSettings = () => {
		this.setState({
			settings: false
		})
	}

	_toggleSettings = () => {
		this.setState({
			settings: !this.state.settings
		}, () => {
			if (this.state.settings && this._settingsRef) {
				this._settingsRef.focus();
			}
		})
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

	renderSettings () {
		return (
			<div className={ "player-js_settings_contain resizes " + (typeof this.state.settings == 'string' ? this.state.settings : '') }>
				<div className="player-js_settings_options">
					<div className="player-js_settings_option" onClick={ this._openSettings.bind(this, 'index_1') }>
						<span>
							<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="16px" height="16px"><path d="M 9 2 L 9 4 L 2 4 L 2 6 L 9 6 L 9 8 L 12 8 L 12 2 L 9 2 z M 14 4 L 14 6 L 22 6 L 22 4 L 14 4 z M 14 9 L 14 11 L 2 11 L 2 13 L 14 13 L 14 15 L 17 15 L 17 9 L 14 9 z M 19 11 L 19 13 L 22 13 L 22 11 L 19 11 z M 4 16 L 4 18 L 2 18 L 2 20 L 4 20 L 4 22 L 7 22 L 7 16 L 4 16 z M 9 18 L 9 20 L 22 20 L 22 18 L 9 18 z"/></svg>
						</span>
						<div>
							Quality
						</div>
						<div>
							{ this.props.driver && (this.props.driver.adaptiveSet || {}).text || '-' }
						</div>
					</div>
				</div>

				<div className="player-js_settings_bitrate">
					{ this.renderLevels() }
				</div>
			</div>
		)
	}

	_openSettings = (settings) => {
		this.setState({
			settings
		})
	}

	renderLevels () {
		let levels = this.props.driver && this.props.driver.adaptiveSets;

		if (!levels) {
			return null;
		}

		return <div style={{ width: '125px' }}>
			<div className="player-js_bitrate_level" onClick={ this._openSettings.bind(this, true) } style={{ marginBottom: '10px' }}>
				<b>Quality</b>
			</div>
			{
				levels.map(level => 
					<div className="player-js_bitrate_level" onClick={ this._setBitrate.bind(this, level) }>
						{ level.text }
					</div>
				)
			}
		</div>;
	}

	_setBitrate = (level) => {
		console.log('req bitrate change', level);

		if (this.props.driver) {
			this.props.driver.adaptiveSet = level;
		}

		this._hideSettings();
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

			case PlaybackAction.VOLUME_MUTE:
				return <svg key="s" fill="currentColor" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="24px" height="24px">    <path d="M 12 3 L 6 9 L 2 9 L 2 15 L 6 15 L 12 21 L 12 3 z M 15.707031 8.2929688 L 14.292969 9.7070312 L 16.585938 12 L 14.292969 14.292969 L 15.707031 15.707031 L 18 13.414062 L 20.292969 15.707031 L 21.707031 14.292969 L 19.414062 12 L 21.707031 9.7070312 L 20.292969 8.2929688 L 18 10.585938 L 15.707031 8.2929688 z"/></svg>;

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