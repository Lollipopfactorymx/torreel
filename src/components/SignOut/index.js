import React from 'react';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import { Redirect } from 'react-router-dom';

class SignOutButton extends React.Component {
	state = {
		toHome: false,
	};
	clickSignOut = (event) => {
		this.props.firebase.doSignOut();
		this.setState(() => ({
			toHome: true,
    }));
    event.preventDefault();
	};
	render() {
		if (this.state.toHome === true) {
			return <Redirect to={ROUTES.HOME} />;
		}
		return (
			<a href='/uno' className='btn-link' onClick={this.clickSignOut}>
				Cerrar sesion
			</a>
		);
	}
}

export default withFirebase(SignOutButton);
