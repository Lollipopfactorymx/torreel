import React from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';

import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';

const SignUpPage = () => (
	<header className='login'>
		<SignUpForm />
	</header>
);

const INITIAL_STATE = {
	fullname: '',
	email: '',
	passwordOne: '',
	passwordTwo: '',
	amount: 0,
	datepayment: '01/01/2020',
	payments: [],
	isAdmin: false,
	error: null,
};

class SignUpFormBase extends React.Component {
	constructor(props) {
		super(props);
		this.state = { ...INITIAL_STATE };
	}

	onSubmit = event => {
		const { fullname, email, passwordOne, datepayment, amount, payments} = this.state;
		const roles = {};
		roles[ROLES.INQUILINO] = ROLES.INQUILINO;
		this.props.firebase
			.doCreateUserWithEmailAndPassword(email, passwordOne)
			.then(authUser => {
				this.setState({ ...INITIAL_STATE });
				this.props.history.push(ROUTES.HOME);
				console.log("authUser ", authUser);

				// Create a user in your Firebase realtime database
				return this.props.firebase.users().doc(authUser.user.uid).set({
					fullname,
					email,
					amount,
					datepayment,
					payments,
					roles,
				});
			})
			.catch(error => {
				this.setState({ error });
			});
		event.preventDefault();
	};

	onChange = event => {
		this.setState({ [event.target.name]: event.target.value });
	};

	render() {
		const { fullname, email, passwordOne, passwordTwo, error } = this.state;
		const isInvalid = passwordOne !== passwordTwo || passwordOne === '' || email === '' || fullname === '';
		return (
			<div className='container-fluid vertical-center'>
				<form onSubmit={this.onSubmit}>
					<div className='color01'>
						<h1>Crear nuevo usuario</h1>
					</div>
					<input name='fullname' className='form-control bg03' value={fullname} onChange={this.onChange} type='text' placeholder='Nombre completo' />
					<input name='email' className='form-control bg03' value={email} onChange={this.onChange} type='text' placeholder='Correo electronico' />
					<input name='passwordOne' className='form-control bg03' value={passwordOne} onChange={this.onChange} type='password' placeholder='Password' />
					<input name='passwordTwo' className='form-control bg03' value={passwordTwo} onChange={this.onChange} type='password' placeholder='Confirmar Password' />

					<button type='submit' disabled={isInvalid} className='btn center-block color01 btn-success'>
						Crear usuario
					</button>
					{error && <div className=" alert alert-danger text-center ">{error.message}</div>}
				</form>
			</div>
		);
	}
}

const SignUpForm = compose(withRouter, withFirebase)(SignUpFormBase);

export default SignUpPage;
export { SignUpForm };
