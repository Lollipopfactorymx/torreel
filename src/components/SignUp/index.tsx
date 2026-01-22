import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

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
	payments: [] as any[],
	isAdmin: false,
	error: null as any,
};

interface Props extends RouteComponentProps {
	firebase: any;
}

class SignUpFormBase extends React.Component<Props, typeof INITIAL_STATE> {
	constructor(props: Props) {
		super(props);
		this.state = { ...INITIAL_STATE };
	}

	onSubmit = (event: React.FormEvent) => {
		const { fullname, email, passwordOne, datepayment, amount, payments } = this.state;
		const roles: any = {};
		roles[ROLES.INQUILINO] = ROLES.INQUILINO;
		this.props.firebase
			.doCreateUserWithEmailAndPassword(email, passwordOne)
			.then((authUser: any) => {
				this.setState({ ...INITIAL_STATE });
				this.props.history.push(ROUTES.DASHBOARD);

				// Create a user in Firestore
				const userRef = doc(this.props.firebase.db, 'users', authUser.user.uid);
				return setDoc(userRef, {
					fullname,
					email,
					amount,
					datepayment,
					payments,
					roles,
				});
			})
			.catch((error: any) => {
				this.setState({ error });
			});
		event.preventDefault();
	};

	onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ [event.target.name]: event.target.value } as any);
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

const SignUpForm = withRouter(withFirebase(SignUpFormBase) as any);

export default SignUpPage;
export { SignUpForm };
