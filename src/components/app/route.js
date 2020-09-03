import { Component, h } from 'preact';
import Match from 'preact-router/match';

/*
 * Route wraps up our component
 */
export default class Route extends Component {
	constructor (props) {
		super(props);

		let { _data } = props;

		if (!_data) return;
		let data = _data[props.url]

		this.state = { data }
	}

	render (props) {
		let { component: Component, _data } = props;

		if (!_data) {
			return <Component {...props} />
		}

		let data = this._data = _data[props.url] || this._data;

		if (!this.burnt
				&& _data[props.url] && _data[props.url].___meta
				&& _data[props.url].___meta.burnable) {
			_data[props.url].___meta.burn();

			this.burnt = true;
		} else if (!_data[props.url]) {
			this.burnt = false;
		}

		return data ? <Component {...props} data={ data } /> : null;
	}
}
