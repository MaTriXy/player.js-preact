import React from 'react';

export default class SeekBar extends React.Component {
	state = {
		seekTime: null
	}

	componentDidMount () {
		if (this.props.mediaRef) {
			console.log('medref', )
			requestAnimationFrame(this._frame)
		}
	}

	componentDidUpdate (prevProps, prevState) {
		if (this.props.mediaRef && !prevProps.mediaRef) {
			this._frame();
		}
	}

	_frame = () => {
		if (this.dead || !this.props.mediaRef) return;

		let totalTime = this.props.totalTime;
		let currentTime = this.props.mediaRef.currentTime;

		if (this.props.rewind) {
			totalTime = this.props.rewind.duration;
			currentTime = Math.min(totalTime, totalTime + (currentTime - this.props.totalTime + 5));
		}

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

		if (this.props.rewind) {
			// ok, we're a live stream with a custom rewind duration
			// so our totalTime = rewind.duration
			// our currentTime = (audio.currentTime - audio.duration + 5)
			// and our bufferedTime = fuck it totalTime

			totalTime = this.props.rewind.duration;
			currentTime = Math.min(totalTime, totalTime + (currentTime - this.props.totalTime + 5));

			bufferedTime = totalTime;

			console.log('rr', totalTime, currentTime)
		}

		return (
			<div className={ "player-js_seek_hit " + (this.props.disabled ? " player-js_seek_disabled" : "") } tabIndex={ -1 } ref={ this._setHitArea } onClick={ this._seekTo } onMouseDown={ this._onSeekStart } onMouseUp={ this._onSeekEnd } >
				<div className={ "player-js_seek" + (this.state.seeking ? " player-js_seeking" : "") }>
					<div className="player-js_seek_base">

					</div>

					<div className="player-js_seek_buffered" style={{ width: (100 * (bufferedTime / totalTime)) + '%' }}>
					</div>

					<div className="player-js_seek_current" ref={ this._setCurrentRef } style={{ width: (100 * (currentTime / totalTime)) + '%' }}>

						<div className="player-js_seek_scrub">
						</div>
					</div>

				</div>
			</div>
		)
	}	

	_setHitArea = (ref) => {
		this._hitArea = ref;
	}

	_setCurrentRef = (ref) => {
		this._currentRef = ref;
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

		if (this.props.rewind) {
			return this.props.totalTime - (this.props.rewind.duration - (x / width * this.props.rewind.duration))
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

		this.setState({
			seekTime
		})

		this.props.onSeek(seekTime);
	}

	_seekTo = (e) => {
		let time = this._getTimeFromClick(e);

		this.props.onSeek(time);
	}
}