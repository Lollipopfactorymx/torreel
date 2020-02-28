import React from 'react';
import { withRouter } from 'react-router-dom';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import { Link } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import userDefaultImg from '../../assets/images/user-default.jpg';
import paperPlaneImg from '../../assets/images/paper-plane-icon.png';

const SignIn = () => <SignInForm />;

const INITIAL_STATE = {
	email: '',
	password: '',
	error: null,
};

class SignInFormBase extends React.Component {
	constructor(props) {
		super(props);
		this.state = { ...INITIAL_STATE };
	}

	onSubmit = event => {
		const { email, password } = this.state;
		this.props.firebase
			.doSignInWithEmailAndPassword(email, password)
			.then(() => {
				this.setState({ ...INITIAL_STATE });
				this.props.history.push(ROUTES.ACCOUNT);
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
		const { email, password, error } = this.state;
		const isInvalid = password === '' || email === '';

		return (
			<header className='login'>
				<div className='container-fluid vertical-center'>
					<img src={userDefaultImg} className='img-circle center-block' alt='img' />
					<form onSubmit={this.onSubmit}>
						<input type='text' name='email' value={email} onChange={this.onChange} className='form-control bg03' placeholder='Correo electronico' />
						<input type='password' name='password' value={password} onChange={this.onChange} className='form-control bg03' placeholder='Password' />
						<button type='submit'  disabled={isInvalid} className='btn center-block bg00 color01'>
							<img src={paperPlaneImg} alt='' className='img-responsive' />
							Enviar
						</button>
						<div className='text-center bg00 color01'>
							¿Olvidaste tu password?
							<Link to={ROUTES.PASSWORD_FORGET} className='btn btn-link color03'>
								Recuperar password
							</Link>
						</div>

						<div className='text-center bg00 color01'>
							¿No tienes cuenta?
							<Link to={ROUTES.SIGN_UP} className='btn btn-link color03'>
								Crear cuenta
							</Link>
						</div>
						{error && <div className=" alert alert-danger text-center ">{error.message}</div>}
					</form>
				</div>
			</header>
		);
	}
}

const SignInForm = compose(withRouter, withFirebase)(SignInFormBase);
export default SignIn;
export { SignInForm };
