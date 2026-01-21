import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Navigation from '../Navigation';

import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';

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

				<Route exact path={ROUTES.LANDING} component={HomePage} />
				<Route path={ROUTES.HOME} component={HomePage} />
				<Route path={ROUTES.SIGN_IN} component={SignIn} />
				<Route path={ROUTES.SIGN_UP} component={SignUp} />
				<Route path={ROUTES.PASSWORD_FORGET} component={PasswordForget} />
				<Route path={ROUTES.MAP} component={MapComponent} />

				{/* Rutas protegidas para usuarios autenticados */}
				<Route path={ROUTES.DASHBOARD} component={DashboardAuth} />
				<Route path={ROUTES.ACCOUNT} component={AccountAuth} />
				<Route path={ROUTES.MYPAYMENTS} component={MyPaymentsAuth} />
				<Route exact path={ROUTES.MY_CONTRACT} component={TenantContractAuth} />
				<Route path={ROUTES.CONTRACT_VIEW} component={ContractViewerAuth} />

				{/* Rutas protegidas solo para Admin */}
				<Route path={ROUTES.TENANT} component={TenantAdmin} />
				<Route path={ROUTES.ADD_TENANT} component={AddTenantAdmin} />
				<Route path={ROUTES.EDIT_TENANT} component={EditTenantAdmin} />
				<Route path={ROUTES.PAYMENT} component={PaymentAdmin} />
				<Route path={ROUTES.DETAIL_PAYMENTS} component={DetailsPaymentAdmin} />
				<Route exact path={ROUTES.CONTRACTS} component={ContractDashboard} />

				<Route path={ROUTES.UPLOAD_EXAMPLE} component={FileUploadExample} />

			</Router>

			<FooterTE />
		</div>
	);
};

export default withAuthentication(App);
