import React, { Component } from 'react';
import { withFirebase } from '../Firebase';

const PasswordForgetPage = () => (
	<header className='login'>
		<PasswordForgetForm />
	</header>
);
const INITIAL_STATE = {
	email: '',
	error: null,
	success: null
};
class PasswordForgetFormBase extends Component<any, any> {
	constructor(props: any) {
		super(props);
		this.state = { ...INITIAL_STATE };
	}
	onSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		const { email } = this.state;

		this.props.firebase
			.doPasswordReset(email)
			.then(() => {
				this.setState({ success: true, error: null });
			})
			.catch((error: any) => {
				this.setState({ error });
			});

	};
	onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ [event.target.name]: event.target.value });
	};
	render() {
		const { email, error, success } = this.state;
		const isInvalid = email === '';
		return (
			<div className='container-fluid vertical-center'>
				<form onSubmit={this.onSubmit}>
					<div className='color01'>
						<h1>Recuperar password</h1>
					</div>
					<input name='email' className='form-control bg03' value={this.state.email} onChange={this.onChange} type='text' placeholder='Correo electronico' />
					<button disabled={isInvalid} type='submit' className='btn center-block color01 btn-success'>
						Reset password
					</button>
					{error && <div className=" alert alert-danger text-center ">{error.message}</div>}
					{success && <div className=" alert alert-success text-center ">Correo enviado</div>}
				</form>
			</div>
		);
	}
}
export default PasswordForgetPage;
const PasswordForgetForm = withFirebase(PasswordForgetFormBase);
export { PasswordForgetForm };
