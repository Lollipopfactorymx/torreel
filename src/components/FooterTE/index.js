import React from 'react';

class FooterTE extends React.Component {
	render() {
		return (
			<footer id='footer' className='bg02'>
				<div className='container-fluid'>
					<div className='row'>
						<nav className='navbar'>
							<ul className='col-xs-12 list-inline text-center'>
								<li>
									<button className='btn-link'>
										<i className='fa fa-facebook fa-2x' aria-hidden='true'></i>
									</button>
								</li>
								<li>
									<button className='btn-link'>
										<i className='fa fa-twitter fa-2x' aria-hidden='true'></i>
									</button>
								</li>
								<li>
									<button className='btn-link'>
										<i className='fa fa-instagram fa-2x' aria-hidden='true'></i>
									</button>
								</li>
							</ul>
							<div className='text-center col-xs-12 color01'>
								<p className='footer-links'>
									<button className="btn-link">¿Quiénes somos?</button> / <button className="btn-link">Ayuda</button> / <button className="btn-link" >Anuncio de privacidad</button>
								</p>
							</div>
						</nav>

						<div className='col-xs-12 text-center color01'>
							<p>Copyright © 2020 lollipop factory. Todos los derechos reservados. Términos y Condiciones , Privacidad y Cookies .</p>
						</div>
					</div>
				</div>
			</footer>
		);
	}
}

export default FooterTE;
