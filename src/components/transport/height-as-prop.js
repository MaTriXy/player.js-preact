import React from 'react';

export default class HeightAsProp extends React.Component {
	render () {
		let TagName = this.props.as;
		let props = Object.assign({}, this.props, { as: undefined, ref: this._setRef })

		return <TagName {...props} />;
	}

	_setRef = (ref) => {
		this._ref = ref;

		if (this.props.componentRef) {
			this.props.componentRef(ref);
		}
	}

	componentDidMount () {
		if (this._ref) {
			let height = this._ref.scrollHeight;

			this._ref.style.setProperty('--height', height + 'px');

			if (typeof ResizeObserver != 'undefined') {
				this.resizeObserver = new ResizeObserver(([changes]) => {
					height = this._ref.scrollHeight;

					this._ref.style.setProperty('--height', height + 'px');
				})

				this.resizeObserver.observe(this._ref);
				this.resizeObserver.observe(this._ref.querySelector('.resizes'));
			}
		}
	}

	componentDidUpdate () {

	}

}