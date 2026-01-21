import React from 'react';
import { Link } from 'react-router-dom';
import { AuthUserContext } from '../Session';
import * as ROUTES from '../../constants/routes';

import menulogo from '../../assets/images/menulogo.png';
import SignOut from '../SignOut';

const Navigation: React.FC = () => (
	<div className="menu-block">
		<AuthUserContext.Consumer>
			{(authUser: any) =>
				authUser ? (
					<NavigationAuth />
				) : (
					<NavigationNonAuth />
				)
			}
		</AuthUserContext.Consumer>
	</div>
);

// Navegación simplificada para usuarios autenticados (el menú principal está en el Sidebar)
const NavigationAuth: React.FC = () => (
	<nav id='main-menu' className='navbar navbar-default navbar-fixed-top bg00'>
		<div className='container'>
			<div className='navbar-header'>
				<Link className='navbar-brand' to={ROUTES.HOME}>
					<img src={menulogo} alt='logotorreEl' />
				</Link>
			</div>
			<ul className='nav navbar-nav navbar-right'>
				<li>
					<SignOut />
				</li>
			</ul>
		</div>
	</nav>
);

const NavigationNonAuth = () => (
	<nav id='main-menu' className='navbar navbar-default navbar-fixed-top bg00'>
		<div className='container'>
			<div className='navbar-header'>
				<button type='button' className='navbar-toggle collapsed color01' data-toggle='collapse' data-target='#menuprincipal' aria-expanded='false'>
					<span className='sr-only'>Toggle navigation</span>
					<span className='icon-bar'></span>
					<span className='icon-bar'></span>
					<span className='icon-bar'></span>
				</button>
				<Link className='navbar-brand' to={ROUTES.HOME}>
					<img src={menulogo} alt='logotorreEl' />
				</Link>
			</div>

			<div className='collapse navbar-collapse' id='menuprincipal'>
				<div className='row'>
					<ul className='nav navbar-nav mainmenu'>
						<li className='dropdown'>
							<Link to={ROUTES.HOME} className='dropdown-toggle' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
								¿Quiénes somos? <span className='marker'></span>
							</Link>
						</li>
						<li className='dropdown'>
							<Link to={ROUTES.SIGN_IN} className='dropdown-toggle' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
								Inicia sesión <span className='marker'></span>
							</Link>
						</li>
						<li>
							<Link className='btn-link' to={ROUTES.SIGN_UP}>
								Regístrate
							</Link>
						</li>
						<li>
							<Link className='btn-link' to={ROUTES.MAP}>
								Mapa
							</Link>
						</li>
						<form className='navbar-form navbar-right'>
							<div className='form-group'>
								<label className='sr-only' htmlFor='exampleInputAmount'>
									Amount (in dollars)
								</label>
								<div className='input-group'>
									<div className='input-group-addon bg07'>
										<i className='fa fa-search fa-lg color03'></i>
									</div>
									<input type='text' className='form-control bg07' id='exampleInputAmount' placeholder='Buscar'></input>
								</div>
							</div>
						</form>
					</ul>
				</div>
				<div className='row'>
					<ul className='nav navbar-nav socialmenu'>
						<li>
							<button className='btn-link'>
								<i className='fa fa-facebook fa-lg' aria-hidden='true'></i>
							</button>
						</li>
						<li>
							<button className='btn-link'>
								<i className='fa fa-twitter fa-lg' aria-hidden='true'></i>
							</button>
						</li>
						<li>
							<button className='btn-link'>
								<i className='fa fa-instagram fa-lg' aria-hidden='true'></i>
							</button>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</nav>
);

export default Navigation;
