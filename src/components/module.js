import Player from './player';
import React from 'react';
import { eventHandlerProps } from '../constants';

import _style from '../style/index.css';

const coerce = (value, name) => {
	if (Object.keys(eventHandlerProps).find(k => 'on' + k == name) && typeof value == 'string') {
		// i mean the dom pretty much does this too...
		return [
			eventHandlerProps[name],
			function (event) {
				return eval(value);
			}
		]
	}

	try {
		return [name, JSON.parse(value)];
	} catch (e) {
	}

	return [name, value];
}

class VideoPlayer extends HTMLElement {
	constructor (props) {
		super(props);

		this.attachShadow({mode: 'open'});

		let style = this._style = document.createElement('style');
		style.innerHTML = _style;

		let playlist = [{}];

		React.render(
			React.createElement(Player, {
				playlist,
				document: this.shadowRoot
			}),
			this.shadowRoot
		);

		this.shadowRoot.appendChild(this._style);
	}

	static get observedAttributes () {
		return ['playlist', 'autoplay'];
	}

	_render () {
		let attributes = Object.fromEntries(
			this.getAttributeNames()
				.map(s => coerce(this.getAttribute(s), s))
		);

		React.render(
			React.createElement(Player, {
				...attributes,
				document: this.shadowRoot
			}),
			this.shadowRoot
		);

		if (!this._style.parentNode)
			this.shadowRoot.appendChild(this._style);
	}

	connectedCallback () {
		this._render();
	}

	attributeChangedCallback () {
		this._render();
	}
}

if (typeof window != 'undefined' && window.customElements) {
	window.customElements.define('video-player', VideoPlayer);
}

export default Player;