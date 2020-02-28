import React from 'react';
import { compose } from 'recompose';

import HeaderTE from '../HeaderTE';
import { withFirebase } from '../Firebase';
import * as ROLES from '../../constants/roles';
import * as ROUTES from '../../constants/routes';

import SideBarAdmin from '../Admin/SidebarAdmin';
import { AuthUserContext, withAuthorization } from '../Session';

class Admin extends React.Component {
	clickSignOut = () => {
		this.props.firebase.doSignOut();
		this.props.history.push(ROUTES.HOME);
		this.setState(() => ({
			toHome: true,
		}));
	};
	render() {
		return (
			<AuthUserContext.Consumer>
				{authUser => (
					<div>
						<HeaderTE small='true' />
						<div className='fondo-rayas container-fluid'>
							<div className='row'>
								<SideBarAdmin email={authUser.email} />

								<div className='col-xs-10 col-sm-9 col-md-10 '>
									<img src={require('../../assets/images/vectores-fondo.png')} className='img-responsive imgfondoadmin' alt='' />
									<div className='bubble-wrapper row text-center'>
										<div className='col-xs-1'>
											<div className='bubble-triangle'></div>
										</div>
										<div className='bubble col-xs-11 col-xs-offset-1 col-md-10 col-md-offset-0 col-lg-9 '>
											<h1>·Inquilino·</h1>
											<div id='inquilino' className='panel panel-default'>
												<div className='panel-body'>
													<div className='row'>
														<div className='col-xs-12 col-sm-10 col-sm-offset-1 col-md-6 col-md-offset-3'>
															<div className='thumbnail'>
																<img src={require('../../assets/images/user-default.jpg')} alt='...' className='img-circle' />
																<div className='caption text-left'>
																	<p>
																		<span>
																			<img src={require('../../assets/images/user-icon.png')} className='small-icon' alt='' />
																		</span>
																		Nombre Apellido
																	</p>
																	<p>
																		<span>
																			<img src={require('../../assets/images/house-icon.png')} className='small-icon' alt='' />
																		</span>
																		Departamento #333
																	</p>
																	<p>
																		<span>
																			<img src={require('../../assets/images/money-icon.png')} className='small-icon' alt='' />
																		</span>
																		Día de pago
																	</p>
																</div>
															</div>
														</div>
														<div className='row'>
															<div className='col-xs-12 col-sm-12'>
																<h3>Historico de Pagos</h3>
																<table className='table table-bordered'>
																	<thead>
																		<tr>
																			<th>Fecha de pagos realizados</th>
																			<th>Recibo de pago</th>
																		</tr>
																	</thead>
																	<tbody>
																		<tr>
																			<td>Enero 2019</td>
																			<td></td>
																		</tr>
																	</tbody>
																</table>
															</div>
														</div>
													</div>
													<div className='gradient-padding'>
														<div className='gradient'></div>
													</div>
													<div className='panel-footer text-left'>
														<a href='/' className='btn bg00'>
															<img src={require('../../assets/images/add-user-icon.png')} alt='' className='img-responsive' />
														</a>
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
const condition = authUser => authUser && !!authUser.roles[ROLES.ADMIN];

export default withAuthorization(condition)(withFirebase(Admin));
