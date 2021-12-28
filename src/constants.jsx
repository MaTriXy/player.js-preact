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

export { PlaybackState, PlaybackAction }