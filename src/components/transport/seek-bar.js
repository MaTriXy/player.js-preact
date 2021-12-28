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

		let currentTime = this.props.mediaRef.currentTime;

		if (currentTime != this._currentTime) {
			this._currentRef.style.width = (100 * currentTime / this.props.totalTime) + '%';
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
		return (
			<div className="player-js_seek_hit" tabIndex={ -1 } ref={ this._setHitArea } onClick={ this._seekTo } onMouseDown={ this._onSeekStart } onMouuseMove={ this._onSeekMove } onMouseUp={ this._onSeekEnd } >
				<div className={ "player-js_seek" + (this.state.seeking ? " player-js_seeking" : "") }>
					<div className="player-js_seek_base">

					</div>

					<div className="player-js_seek_buffered" style={{ width: (100 * (this.props.bufferedTime / this.props.totalTime)) + '%' }}>
					</div>

					<div className="player-js_seek_current" ref={ this._setCurrentRef } style={{ width: (100 * ((this.state.seekTime !== null ? this.state.seekTime : this.props.currentTime ) / this.props.totalTime)) + '%' }}>

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