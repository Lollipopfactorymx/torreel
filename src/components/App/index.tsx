import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navigation from '../Navigation';

import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';

//components
import FooterTE from '../FooterTE';
import HomePage from '../Home';
import SignIn from '../SignIn';
import SignUp from '../SignUp';
import PasswordForget from '../PasswordForget';

import Account from '../Account';
import Tenant from '../Tenant';
import AddTenant from '../Tenant/add';
import EditTenant from '../Tenant/edit';

import Payment from '../Payment';
import DetailsPayment from '../Payment/details';
import MyPayments from '../Payment/MyPayments';

import { ContractDashboard, ContractViewer, TenantContract } from '../Contract';
import FileUploadExample from '../FileUpload/FileUploadExample';
import Dashboard from '../Dashboard';

import { withAuthentication, withAuthorization } from '../Session';

// Condiciones de autorización
const isAdmin = (authUser: any) => authUser && authUser.roles && authUser.roles[ROLES.ADMIN];
const isAuthenticated = (authUser: any) => !!authUser;

// Componentes protegidos para Admin
const TenantAdmin = withAuthorization(isAdmin)(Tenant);
const AddTenantAdmin = withAuthorization(isAdmin)(AddTenant);
const EditTenantAdmin = withAuthorization(isAdmin)(EditTenant);
const PaymentAdmin = withAuthorization(isAdmin)(Payment);
const DetailsPaymentAdmin = withAuthorization(isAdmin)(DetailsPayment);

// Componentes protegidos para usuarios autenticados
const DashboardAuth = withAuthorization(isAuthenticated)(Dashboard);
const AccountAuth = withAuthorization(isAuthenticated)(Account);
const MyPaymentsAuth = withAuthorization(isAuthenticated)(MyPayments);
const TenantContractAuth = withAuthorization(isAuthenticated)(TenantContract);
const ContractViewerAuth = withAuthorization(isAuthenticated)(ContractViewer);

const App: React.FC = () => {
	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://use.fontawesome.com/fe573de431.js';
		script.async = true;
		document.head.appendChild(script);
	}, []);

	return (
		<div id='wrapper'>
			<Router>
				<Navigation />

				<Switch>
					<Route exact path={ROUTES.LANDING} component={HomePage} />
					<Route exact path={ROUTES.HOME} component={HomePage} />
					<Route exact path={ROUTES.SIGN_IN} component={SignIn} />
					<Route exact path={ROUTES.SIGN_UP} component={SignUp} />
					<Route exact path={ROUTES.PASSWORD_FORGET} component={PasswordForget} />

					{/* Rutas protegidas para usuarios autenticados */}
					<Route exact path={ROUTES.DASHBOARD} component={DashboardAuth} />
					<Route exact path={ROUTES.ACCOUNT} component={AccountAuth} />
					<Route exact path={ROUTES.MYPAYMENTS} component={MyPaymentsAuth} />
					<Route exact path={ROUTES.MY_CONTRACT} component={TenantContractAuth} />
					<Route exact path={ROUTES.CONTRACT_VIEW} component={ContractViewerAuth} />

					{/* Rutas protegidas solo para Admin */}
					<Route exact path={ROUTES.TENANT} component={TenantAdmin} />
					<Route exact path={ROUTES.ADD_TENANT} component={AddTenantAdmin} />
					<Route exact path={ROUTES.EDIT_TENANT} component={EditTenantAdmin} />
					<Route exact path={ROUTES.DETAIL_PAYMENTS} component={DetailsPaymentAdmin} />
					<Route exact path={ROUTES.PAYMENT} component={PaymentAdmin} />
					<Route exact path={ROUTES.CONTRACTS} component={ContractDashboard} />

					<Route exact path={ROUTES.UPLOAD_EXAMPLE} component={FileUploadExample} />
				</Switch>

			</Router>

			<FooterTE />
		</div>
	);
};

export default withAuthentication(App);
