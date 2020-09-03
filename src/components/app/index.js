import React from 'react';
import { Router, Match } from 'preact-router';

import Route from './route';

import Main from './main';

export default class App extends React.Component {
	constructor (props) {
		super(props);

		if (props.CLI_DATA && props.CLI_DATA.preRenderData) {
			props = props.CLI_DATA.preRenderData;
		}

		this.state = {
			_data: {
				[props.url]: props.data,
				fetch: this.fetch
			}
		}
	}

	fetch = async (url) => {
		if (typeof window == 'undefined') return;

		let resp = await window.fetch('/api' + url);
		let json = await resp.json();

		let expires = resp.headers.get('expires');

		this.setState((oldState) => ({
			_data: Object.assign({}, oldState._data, {
				[url]: Object.assign(json, {
					___meta: {
						status: resp.status,
						burnable: !!expires,
						burn: this.burn.bind(this, url)
					}
				})
			})
		}))
	}

	burn = (url) => {
		this.setState((oldState) => ({
			_data: Object.assign({}, oldState._data, {
				[url]: undefined
			})
		}))
	}

	handleRoute = async ({ url }) => {
		this.state._data[url] || this.fetch(url);
	}

	render ({ url }, { _data }) {
		return (
			<div>
				<Router url={ url } onChange={ this.handleRoute }>
					<Route component={ Main } _data={ _data } default />
					<Route component={ Main } _data={ _data } path="/test" />
				</Router>
			</div>
		);
	}
}
