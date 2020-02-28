import React from 'react';
import { Link } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';
import { AuthUserContext } from '../Session';

import userDefaultImg from '../../assets/images/user-default.jpg';
import envelopeIcon from '../../assets/images/envelope-icon.png';
import bubbleIcon from '../../assets/images/bubble-icon.png';
import userIcon from '../../assets/images/user-icon.png';
import moneyIcon from '../../assets/images/money-icon.png';
import chartIcon from '../../assets/images/chart-icon.png';
import lockIcon from '../../assets/images/lock-icon.png';
import contractIcon from '../../assets/images/contract-icon.png';
import houseIcon from '../../assets/images/house-icon.png';

interface SideBarAdminProps {
	email?: string;
	firebase?: any;
	history?: any;
}

class SideBarAdmin extends React.Component<SideBarAdminProps, any> {
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
				{(authUser: any) => {
					const isAdmin = authUser?.roles && authUser.roles[ROLES.ADMIN];

					return (
						<div className='col-xs-2 col-sm-3 col-md-2 sidebar bg04'>
							<div className='thumbnail'>
								<img src={userDefaultImg} alt='...' className='img-circle' />
								<div className='caption text-center'>
									<a href='#' className='btn'>
										<img src={envelopeIcon} alt='' />
									</a>
									<a href='#' className='btn'>
										<img src={bubbleIcon} alt='' />
									</a>
								</div>
								{this.props.email && <div className='text-center'>{this.props.email}</div>}
							</div>

							<ul className='nav'>
								{/* Dashboard para todos */}
								<li className='hidden-xs'>
									<Link to={ROUTES.DASHBOARD} className='btn text-left'>
										<span>
											<img src={houseIcon} className='' alt='' />
										</span>
										Dashboard
									</Link>
								</li>
								<li className='hidden-sm hidden-md hidden-lg'>
									<Link to={ROUTES.DASHBOARD} className='btn icon-xs-screen'>
										<img src={houseIcon} alt='' />
									</Link>
								</li>

								{isAdmin ? (
									<>
										{/* Menú para ADMINISTRADOR */}
										<li className='hidden-xs'>
											<Link to={ROUTES.TENANT} className='btn text-left'>
												<span>
													<img src={userIcon} className='' alt='' />
												</span>
												Inquilinos
											</Link>
										</li>
										<li className='hidden-sm hidden-md hidden-lg'>
											<Link to={ROUTES.TENANT} className='btn icon-xs-screen'>
												<img src={userIcon} alt='' />
											</Link>
										</li>

										<li className='hidden-xs'>
											<Link to={ROUTES.PAYMENT} className='btn text-left'>
												<span>
													<img src={moneyIcon} className='' alt='' />
												</span>
												Pagos
											</Link>
										</li>
										<li className='hidden-sm hidden-md hidden-lg'>
											<Link to={ROUTES.PAYMENT} className='btn icon-xs-screen'>
												<img src={moneyIcon} alt='' />
											</Link>
										</li>

										<li className='hidden-xs'>
											<Link to={ROUTES.CONTRACTS} className='btn text-left'>
												<span>
													<img src={contractIcon} className='' alt='' />
												</span>
												Contratos
											</Link>
										</li>
										<li className='hidden-sm hidden-md hidden-lg'>
											<Link to={ROUTES.CONTRACTS} className='btn icon-xs-screen'>
												<img src={contractIcon} alt='' />
											</Link>
										</li>

										<li className='hidden-xs'>
											<a href='#' className='btn text-left'>
												<span>
													<img src={chartIcon} className='' alt='' />
												</span>
												Estadísticas
											</a>
										</li>
										<li className='hidden-sm hidden-md hidden-lg'>
											<a href='#' className='btn icon-xs-screen'>
												<img src={chartIcon} alt='' />
											</a>
										</li>
									</>
								) : (
									<>
										{/* Menú para INQUILINO */}
										<li className='hidden-xs'>
											<Link to={ROUTES.MY_CONTRACT} className='btn text-left'>
												<span>
													<img src={contractIcon} className='' alt='' />
												</span>
												Mi Contrato
											</Link>
										</li>
										<li className='hidden-sm hidden-md hidden-lg'>
											<Link to={ROUTES.MY_CONTRACT} className='btn icon-xs-screen'>
												<img src={contractIcon} alt='' />
											</Link>
										</li>

										<li className='hidden-xs'>
											<Link to={ROUTES.MYPAYMENTS} className='btn text-left'>
												<span>
													<img src={moneyIcon} className='' alt='' />
												</span>
												Mis Pagos
											</Link>
										</li>
										<li className='hidden-sm hidden-md hidden-lg'>
											<Link to={ROUTES.MYPAYMENTS} className='btn icon-xs-screen'>
												<img src={moneyIcon} alt='' />
											</Link>
										</li>

										<li className='hidden-xs'>
											<Link to={ROUTES.ACCOUNT} className='btn text-left'>
												<span>
													<img src={userIcon} className='' alt='' />
												</span>
												Mi Cuenta
											</Link>
										</li>
										<li className='hidden-sm hidden-md hidden-lg'>
											<Link to={ROUTES.ACCOUNT} className='btn icon-xs-screen'>
												<img src={userIcon} alt='' />
											</Link>
										</li>
									</>
								)}

								{/* Cerrar sesión para todos */}
								<li className='hidden-xs'>
									<a href='#' className='btn text-left' onClick={this.clickSignOut}>
										<span>
											<img src={lockIcon} className='' alt='' />
										</span>
										Cerrar sesión
									</a>
								</li>
								<li className='hidden-sm hidden-md hidden-lg'>
									<a href='#' className='btn icon-xs-screen' onClick={this.clickSignOut}>
										<img src={lockIcon} alt='' />
									</a>
								</li>
							</ul>
						</div>
					);
				}}
			</AuthUserContext.Consumer>
		);
	}
}

export default SideBarAdmin;
