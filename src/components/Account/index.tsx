import React from 'react';
import HeaderTE from '../HeaderTE';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import SideBarAdmin from '../Admin/SidebarAdmin';
import { AuthUserContext, withAuthorization } from '../Session';
import TelegramConnect from './TelegramConnect';

import vectoresFondoImg from '../../assets/images/vectores-fondo.png';
import userDefaultImg from '../../assets/images/user-default.jpg';
import userIcon from '../../assets/images/user-icon.png';
import houseIcon from '../../assets/images/house-icon.png';
import moneyIcon from '../../assets/images/money-icon.png';

class Account extends React.Component<any, any> {
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
									<img src={vectoresFondoImg} className='img-responsive imgfondoadmin' alt='' />
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
																<img src={userDefaultImg} alt='...' className='img-circle' />
																<div className='caption text-left'>
																	<p>
																		<span>
																			<img src={userIcon} className='small-icon' alt='' />
																		</span>
																		Nombre: {authUser?.fullname}
																	</p>
																	<p>
																		<span>
																			<img src={houseIcon} className='small-icon' alt='' />
																		</span>
																		Departamento: #{authUser?.department}
																	</p>
																	<p>
																		<span>
																			<img src={moneyIcon} className='small-icon' alt='' />
																		</span>
																		Día de pago: {authUser?.datepayment}
																	</p>
																</div>
															</div>
														</div>

														{/* Telegram Connection */}
														<div className='row'>
															<div className='col-xs-12'>
																<TelegramConnect
																	firebase={this.props.firebase}
																	userId={authUser.uid}
																	currentChatId={authUser.telegramChatId}
																/>
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

export default withAuthorization(condition)(withFirebase(Account));
