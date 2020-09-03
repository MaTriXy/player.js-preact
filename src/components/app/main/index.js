import React from 'react';
import { Text } from '@fluentui/react';
import style from './style.css';

export default class Main extends React.Component {
	render () {
		let { data } = this.props;

		if (!data) {
			return null;
		}

		let { title, body } = data;

		return (
			<div className={ style.main }>
				<h1><Text variant="xxLarge">{ title }</Text></h1>

				<p><Text variant="large">{ body }</Text></p>
			</div>
		)
	}	
}