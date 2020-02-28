import React from 'react';
import HeaderTE from '../HeaderTE';
import { withFirebase } from '../Firebase';
import SideBarAdmin from '../Admin/SidebarAdmin';
import { AuthUserContext, withAuthorization } from '../Session';
import { Link } from 'react-router-dom';

import * as ROLES from '../../constants/roles';
import * as ROUTES from '../../constants/routes';

class DetailsPayment extends React.Component {
	constructor(props) {
        super(props);
        this.state = {
            loading: false,
            users: [],
        };
    }
    componentDidMount() {
        this.setState({ loading: true });
        this.props.firebase.users().get()
            .then(querySnapshot => {
                const usersList = [];
                querySnapshot.forEach(function(doc) {
                    usersList.push({...doc.data(), uid: doc.id});
                });
               
                this.setState({
                    users: usersList,
                    loading: false,
                });
            });
    }
	render() {
        const { users, loading } = this.state;

		return (
			<AuthUserContext.Consumer>
				{authUser => (
					<div>
						<HeaderTE small='true' />
						<div className='fondo-rayas container-fluid'>
							<div className='row'>
								<SideBarAdmin email={authUser.email}/>

								<div className='col-xs-10 col-sm-9 col-md-10 '>
									<img src={require('../../assets/images/vectores-fondo.png')} className='img-responsive imgfondoadmin' alt='' />
									<div className='bubble-wrapper row text-center'>
										<div className='col-xs-1'>
											<div className='bubble-triangle'></div>
										</div>
										<div className='bubble col-xs-11 col-xs-offset-1 col-md-10 col-md-offset-0 col-lg-9 '>
                                            {authUser.roles[ROLES.ADMIN] && (
                                                <h1>·Listado de pagos·</h1>
                                            )}

                                            {!authUser.roles[ROLES.ADMIN] && (
                                                <h1>·Listado de tus pagos·</h1>
                                            )}
											<div id='inquilino' className='panel panel-default'>
												<div className='panel-body'>
                                                    <div className='row'>

                                                    {authUser.roles[ROLES.ADMIN] && (
														<div className='panel-footer text-right'>
                                                            <Link to={ROUTES.ADD_TENANT} className='btn bg00'>
                                                                <img src={require('../../assets/images/money-icon.png')} alt='' className='img-responsive' />
                                                            </Link>
														</div>
													)}

                                                    </div>
													<div className='row'>
                                                        <table className="table table-bordered">
                                                            <thead>
                                                                <tr>
                                                                    <th>Usuario</th>
                                                                    <th>Departamento</th>
                                                                    <th>Ultimo pago</th>
                                                                    <th></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {loading && (
                                                                    <tr>
                                                                        <td>
                                                                            <div>Loading ...</div>
                                                                        </td>
                                                                    </tr>
                                                                )}

                                                                {users.map(user => (
                                                                    <tr key={user.uid}>
                                                                        <td>{user.fullname}</td>
                                                                        <td>{user.department}</td>
                                                                        <td><Link to={"/edit_tenant/" + user.uid } className="btn btn-info"><i className="fa fa-pencil"></i></Link></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
													</div>
													<div className='gradient-padding'>
														<div className='gradient'></div>
													</div>
													
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</AuthUserContext.Consumer>
		);
	}
}
const condition = authUser => !!authUser;

export default withAuthorization(condition)(withFirebase(DetailsPayment));
