import React from 'react';

export default class SeekBar extends React.Component {
	state = {
		seekTime: null
	}

	componentDidMount () {
		if (this.props.mediaRef) {
			// console.log('medref', )
			requestAnimationFrame(this._frame)
		}
	}

	componentDidUpdate (prevProps, prevState) {
		if (this.props.mediaRef && !prevProps.mediaRef) {
			this._frame();
		}
	}

	_frame = () => {
		return;

		if (this.dead || !this.props.mediaRef) return;

		let totalTime = this.props.totalTime;
		let currentTime = this.props.mediaRef.currentTime;

		if (this.props.driver && this.props.rewind) {
			let liveTotalTime = this.props.driver && this.props.driver.liveTotalTime;

			totalTime = this.props.rewind.duration;

			currentTime = totalTime - (liveTotalTime - this.props.driver.currentTime) + this.props.driver.tolerance;
		}

		currentTime = Math.min(currentTime, totalTime)

		if (currentTime != this._currentTime) {
			this._currentRef.style.width = (100 * currentTime / totalTime) + '%';
			this._currentTime = currentTime;
		}

		setTimeout(() => {
			requestAnimationFrame(this._frame)
		}, 80)
	}

	componentWillUnmount () {
		this.dead = true;
	}

	render () {
		let currentTime = (this.state.seekTime !== null ? this.state.seekTime : this.props.currentTime);
		let bufferedTime = this.props.bufferedTime;
		let totalTime = this.props.totalTime;

		if (this.props.rewind && this.props.driver) {
			let liveTotalTime = this.props.driver && this.props.driver.liveTotalTime;

			totalTime = this.props.rewind.duration;

			currentTime = totalTime - (liveTotalTime - this.props.driver.currentTime) + this.props.driver.tolerance;
		}

		currentTime = Math.min(currentTime, totalTime);
		bufferedTime = Math.min(bufferedTime, totalTime);

		return (
			<div className={ "player-js_seek_hit " + (this.props.disabled ? " player-js_seek_disabled" : "") } tabIndex={ -1 } ref={ this._setHitArea } onClick={ this._seekTo } onMouseMove={ this._onLabelMove } onMouseDown={ this._onSeekStart } onMouseUp={ this._onSeekEnd } >
				<div className={ "player-js_seek" + (this.state.seeking ? " player-js_seeking" : "") }>
					<div className="player-js_seek_base">

					</div>

					<div className="player-js_seek_buffered" style={{ width: (100 * (bufferedTime / totalTime)) + '%' }}>
					</div>

					<div className="player-js_seek_scrubbar" ref={ this._setSeekRef } style={{ width: '0%' }}>
					</div>

					<div className="player-js_seek_current" ref={ this._setCurrentRef } style={{ width: (100 * (currentTime / totalTime)) + '%' }}>

						<div className="player-js_seek_scrub">
						</div>
					</div>

					<div className="player-js_seek_label" ref={ this._setLabelRef }>
					</div>

				</div>
			</div>
		)
	}	

	_setHitArea = (ref) => {
		this._hitArea = ref;
	}

	_setLabelRef = (ref) => {
		this._labelRef = ref;
	}

	_setCurrentRef = (ref) => {
		this._currentRef = ref;
	}

	_setSeekRef = (ref) => {
		this._seekRef = ref;
	}

	_onSeekStart = (e) => {
		e.preventDefault()

		this._shouldPlay = this.props.state == 4;

		this.setState({
			seeking: true,
			seekTime: this._getTimeFromClick(e)
		})

		window.addEventListener('mouseup', this._onSeekEnd)
		window.addEventListener('mousemove', this._onSeekMove)

		if (this._shouldPlay) {
			this.props.onPause(false)
		}
	}

	_getTimeFromClick (e) {
		let rect = this._hitArea.getBoundingClientRect()
		let width = rect.width - 10;
		let x = Math.min(Math.max(e.pageX - rect.left - 6, 0), width);

		if (this.props.rewind && this.props.driver) {

			return this.props.driver.liveTotalTime - (this.props.rewind.duration - (x / width * this.props.rewind.duration));
		}

		return x / width * this.props.totalTime;
	}

	_onSeekEnd = (e) => {
		this.setState({
			seeking: false,
			seekTime: null
		})

		window.removeEventListener('mouseup', this._onSeekEnd)
		window.removeEventListener('mousemove', this._onSeekMove)

		if (this._shouldPlay) {
			this.props.onPlay(false)
			this._shouldPlay = undefined;
		}
	}

	_onSeekMove = (e) => {
		if (!this.state.seeking) return;

		let seekTime = this._getTimeFromClick(e);

		if (this.props.driver) {
			seekTime -= this.props.driver.tolerance;
		}

		this.setState({
			seekTime
		})

		this.props.onSeek(seekTime);
	}

	_onLabelMove = (e) => {
		if (!this._labelRef) return;

		let rect = this._hitArea.getBoundingClientRect()
		this._labelRef.style.left = (e.pageX - rect.left - 34) + 'px';

		this._seekRef.style.width = (e.pageX - rect.left - 5) + 'px';

		requestAnimationFrame(() => {
			let selectedTime = this._getTimeFromClick(e);
			let negate = false;

			if (this.props.driver && this.props.rewind && this.props.rewind.duration) {
				selectedTime = Math.floor(this.props.driver.liveTotalTime - selectedTime);
				negate = selectedTime > 0;
			}

			this._labelRef.textContent = (negate ? '-' : '') + this.renderTime(selectedTime)
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


	_seekTo = (e) => {
		let time = this._getTimeFromClick(e);

		if (this.props.driver) {
			time -= this.props.driver.tolerance;
		}

		this.props.onSeek(time);
	}
}