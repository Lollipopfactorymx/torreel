import React from 'react';
import HeaderTE from '../HeaderTE';
import aguaImg from '../../assets/images/agua.png';
import luzImg from '../../assets/images/luz.png';
import internetImg from '../../assets/images/internet.png';
import vigilanciaImg from '../../assets/images/vigilancia.png';

import AwesomeSlider from 'react-awesome-slider';
import withAutoplay from 'react-awesome-slider/dist/autoplay';
import 'react-awesome-slider/dist/styles.css';

const AutoplaySlider = withAutoplay(AwesomeSlider);

class Home extends React.Component {
	render() {
		return (
			<div>
				<HeaderTE />

				<div className='fondo-rayas container-fluid'>
					<section id='servicios'>
						<div className='container'>
							<div className='row'>
								<h2 className='text-center'>·Solicita informes al celular 2223868288</h2>
							</div>
							<br />
							<br />
							<div className='row'>
								<h2 className='text-center'>
									·Revisa nuestras reglas internas en el siguiente link -<a href='https://www.dropbox.com/s/qk57vskxkq0l23m/Reglas%20de%20torre%20EL.docx?dl=0'>Reglas internas</a>
								</h2>
							</div>
							<div className='row'>
								<div className='col-xs-12 text-center'>
									<h2>·Servicios·</h2>
								</div>
								<div className='col-xs-6 col-sm-3'>
									<div className='thumbnail'>
										<img src={aguaImg} className='img-circle img-thumbnail' alt='...' />
										<div className='caption text-center'>
											<h3>Agua</h3>
										</div>
									</div>
								</div>
								<div className='col-xs-6 col-sm-3'>
									<div className='thumbnail'>
										<img src={luzImg} className='img-circle img-thumbnail' alt='...' />
										<div className='caption text-center'>
											<h3>Luz</h3>
										</div>
									</div>
								</div>
								<div className='col-xs-6 col-sm-3'>
									<div className='thumbnail'>
										<img src={internetImg} className='img-circle img-thumbnail' alt='...' />
										<div className='caption text-center'>
											<h3>Internet</h3>
										</div>
									</div>
								</div>
								<div className='col-xs-6 col-sm-3'>
									<div className='thumbnail'>
										<img src={vigilanciaImg} className='img-circle img-thumbnail' alt='...' />
										<div className='caption text-center'>
											<h3>Camaras de Vigilancia</h3>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>

					<section id='galeria'>
						<div className='container'>
							<div className='row justify-content-md-center'>
								<div className='col-xs-12  text-center'>
									<h2>·Galería de imágenes·</h2>

									<div className='col-xs-12 col-md-8 col-md-offset-2'>
										<div className='galleria d-flex justify-content-center'>
											<AutoplaySlider
												play={true}
												cancelOnInteraction={false} // should stop playing on user interaction
												interval={6000}
												fillParent='true'>
												<img data-src={require("../../assets/images/fotos/1.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/2.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/3.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/4.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/5.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/6.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/7.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/8.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/9.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/10.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/11.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/12.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/13.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/14.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/15.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/16.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/17.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/18.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/19.jpg")} alt='' />
												<img data-src={require("../../assets/images/fotos/20.jpg")} alt='' />
											</AutoplaySlider>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>

					<section id='contacto'>
						<div className='container'>
							<div className='row'>
								<h2 className='text-center'>·Contacto·</h2>
								Celular: 2227868288
								<br />
								Correo electronico : joseluispalillero@hotmail.com
							</div>
						</div>
					</section>
				</div>
			</div>
		);
	}
}

export default Home;
