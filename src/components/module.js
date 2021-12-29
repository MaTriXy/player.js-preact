import Player from './player';
import React from 'react';

class VideoPlayer extends HTMLElement {
	constructor (props) {
		super(props);

		this.attachShadow({mode: 'open'});

		let style = document.createElement('link');
		style.rel = 'stylesheet';
		style.href = 'src/style/index.css';

		let playlist = [{}];

		React.render(
			React.createElement(Player, {
				playlist,
				document: this.shadowRoot
			}),
			this.shadowRoot
		);

		this.shadowRoot.appendChild(style);
	}

	connectedCallback () {
		let playlist = JSON.parse(this.getAttribute('playlist'));

		React.render(
			React.createElement(Player, {
				playlist,
				document: this.shadowRoot
			}),
			this.shadowRoot
		);
	}
}

if (typeof window != 'undefined' && window.customElements) {
	window.customElements.define('video-player', VideoPlayer);
}

export default Player;