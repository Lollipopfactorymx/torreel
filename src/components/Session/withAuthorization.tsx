import React from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from '../../utils/compose';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

const withAuthorization = (condition: (authUser: any) => boolean) => (Component: any) => {
	class WithAuthorization extends React.Component<any, any> {
		listener: any;
		componentDidMount() {
			this.listener = this.props.firebase.onAuthUserListener(
				(authUser: any) => {
					if (!condition(authUser)) {
						this.props.history.push(ROUTES.SIGN_IN);
					}
				},
				() => this.props.history.push(ROUTES.SIGN_IN)
			);
		}
		componentWillUnmount() {
			this.listener();
		}
		render() {
			return <AuthUserContext.Consumer>{(authUser: any) => (condition(authUser) ? <Component {...this.props} /> : null)}</AuthUserContext.Consumer>;
		}
	}
	return compose(withRouter, withFirebase)(WithAuthorization);
};
export default withAuthorization;
