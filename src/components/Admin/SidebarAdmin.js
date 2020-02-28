import React from 'react';
import { Link } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';

class SideBarAdmin extends React.Component {
	clickSignOut = () => {
		this.props.firebase.doSignOut();
		this.props.history.push(ROUTES.HOME);
		this.setState(() => ({
			toHome: true,
		}));
	};
	render() {
		return (
			<div className='col-xs-2 col-sm-3 col-md-2 sidebar bg04'>
				<div className='thumbnail'>
					<img src={require('../../assets/images/user-default.jpg')} alt='...' className='img-circle' />
					<div className='caption text-center'>
						<a href='#' className='btn'>
							<img src={require('../../assets/images/envelope-icon.png')} alt='' />
						</a>
						<a href='#' className='btn'>
							<img src={require('../../assets/images/bubble-icon.png')} alt='' />
						</a>
					</div>

					{this.props.email && <div className='text-center'>{this.props.email}</div>}
				</div>
				<ul className='nav'>
					<li className='hidden-xs'>
						<Link to={ROUTES.TENANT} className='btn text-left'>
							<span>
								<img src={require('../../assets/images/user-icon.png')} className='' alt='' />
							</span>
							Inquilinos 
						</Link>

					</li>
					<li className='hidden-sm hidden-md hidden-lg'>
						<a href='#' className='btn icon-xs-screen'>
							<img src={require('../../assets/images/user-icon.png')} alt='' />
						</a>
					</li>
					<li className='hidden-xs'>
						<Link to={ROUTES.PAYMENT} className='btn text-left'>
							<span>
								<img src={require('../../assets/images/money-icon.png')} className='' alt='' />
							</span>
							Pagos
						</Link>
					</li>
					<li className='hidden-sm hidden-md hidden-lg'>
						<a href='#' className='btn icon-xs-screen'>
							<img src={require('../../assets/images/money-icon.png')} alt='' />
						</a>
					</li>
					<li className='hidden-xs'>
						<a href='#' className='btn text-left'>
							<span>
								<img src={require('../../assets/images/chart-icon.png')} className='' alt='' />
							</span>
							Estadísticas
						</a>
					</li>
					<li className='hidden-sm hidden-md hidden-lg'>
						<a href='#' className='btn icon-xs-screen'>
							<img src={require('../../assets/images/chart-icon.png')} alt='' />
						</a>
					</li>
					<li className='hidden-xs'>
						<a href='#' className='btn text-left' onClick={this.clickSignOut}>
							<span>
								<img src={require('../../assets/images/lock-icon.png')} className='' alt='' />
							</span>
							Cerrar sesión
						</a>
					</li>
					<li className='hidden-sm hidden-md hidden-lg'>
						<a href='#' className='btn icon-xs-screen' onClick={this.clickSignOut}>
							<img src={require('../../assets/images/lock-icon.png')} alt='' />
						</a>
					</li>
				</ul>
			</div>
		);
	}
}

export default SideBarAdmin;
