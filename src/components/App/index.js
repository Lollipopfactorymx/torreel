import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Navigation from '../Navigation';

import * as ROUTES from '../../constants/routes';

//components
import FooterTE from '../FooterTE';
import HomePage from '../Home';
import SignIn from '../SignIn';
import SignUp from '../SignUp';
import PasswordForget from '../PasswordForget';
import MapComponent from '../Map';

import Account from '../Account';
import Tenant from '../Tenant';
import AddTenant from '../Tenant/add';
import EditTenant from '../Tenant/edit';

import Payment from '../Payment';
import DetailsPayment from '../Payment/details';

import { withAuthentication } from '../Session';

class App extends React.Component {
	componentDidMount() {
		const script = document.createElement('script');
		script.src = 'https://use.fontawesome.com/fe573de431.js';
		script.async = true;
		document.head.appendChild(script);
	}
	render() {
		return (
			<React.Fragment>
				<div id='wrapper'>
					<Router>
						<Navigation />

						<Route exact path={ROUTES.LANDING} component={HomePage} />
						<Route path={ROUTES.HOME} component={HomePage} />
						<Route path={ROUTES.SIGN_IN} component={SignIn} />
						<Route path={ROUTES.SIGN_UP} component={SignUp} />
						<Route path={ROUTES.PASSWORD_FORGET} component={PasswordForget} />
						<Route path={ROUTES.MAP} component={MapComponent} />

						<Route path={ROUTES.ACCOUNT} component={Account} />
						<Route path={ROUTES.TENANT} component={Tenant} />
						<Route path={ROUTES.ADD_TENANT} component={AddTenant} />
						<Route path={ROUTES.EDIT_TENANT} component={EditTenant} />
						
						<Route path={ROUTES.PAYMENT} component={Payment} />
						<Route path={ROUTES.DETAIL_PAYMENTS} component={DetailsPayment} />
						
					</Router>

					<FooterTE />
				</div>
			</React.Fragment>
		);
	}
}

export default withAuthentication(App);
