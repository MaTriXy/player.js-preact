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
	PAUSE: 5,
	FORWARD_5: 6,
	REWIND_5: 7,
	VOLUME_UP: 8,
	VOLUME_DOWN: 9,
	VOLUME_MUTE: 10
}

export { PlaybackState, PlaybackAction }