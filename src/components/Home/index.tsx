import React from 'react';
import HeaderTE from '../HeaderTE';
import aguaImg from '../../assets/images/agua.png';
import luzImg from '../../assets/images/luz.png';
import internetImg from '../../assets/images/internet.png';
import vigilanciaImg from '../../assets/images/vigilancia.png';
import emailjs from '@emailjs/browser';

import AwesomeSlider from 'react-awesome-slider';
import withAutoplay from 'react-awesome-slider/dist/autoplay';
import 'react-awesome-slider/dist/styles.css';

const AutoplaySlider = withAutoplay(AwesomeSlider);

const imagesGlob = import.meta.glob('../../assets/images/fotos/*.jpg', { eager: true, as: 'url' });
const imageUrls = Object.keys(imagesGlob)
	.sort((a, b) => {
		const matchA = a.match(/\d+/);
		const matchB = b.match(/\d+/);
		const numA = parseInt(matchA ? matchA[0] : '0');
		const numB = parseInt(matchB ? matchB[0] : '0');
		return numA - numB;
	})
	.map(key => imagesGlob[key]);

interface HomeState {
	contactForm: {
		name: string;
		email: string;
		phone: string;
		message: string;
	};
	sending: boolean;
	sent: boolean;
	error: string | null;
}

class Home extends React.Component<any, HomeState> {
	constructor(props: any) {
		super(props);
		this.state = {
			contactForm: {
				name: '',
				email: '',
				phone: '',
				message: 'Me interesan los informes sobre los departamentos disponibles.'
			},
			sending: false,
			sent: false,
			error: null
		};

		// Inicializar EmailJS
		emailjs.init('ufwam3jbHzFn9WANh');
	}

	handleContactFormChange = (field: keyof HomeState['contactForm'], value: string) => {
		this.setState(prevState => ({
			contactForm: {
				...prevState.contactForm,
				[field]: value
			}
		}));
	};

	handleSendContact = async (e: React.FormEvent) => {
		e.preventDefault();
		this.setState({ sending: true, error: null, sent: false });

		try {
			const templateParams = {
				from_name: this.state.contactForm.name,
				from_email: this.state.contactForm.email,
				from_phone: this.state.contactForm.phone,
				message: this.state.contactForm.message,
				to_email: 'joseluispalillero@hotmail.com'
			};

			await emailjs.send(
				'PALX',
				'template_qzt1jbq',
				templateParams
			);

			this.setState({
				sent: true,
				sending: false,
				contactForm: {
					name: '',
					email: '',
					phone: '',
					message: 'Me interesan los informes sobre los departamentos disponibles.'
				}
			});

			setTimeout(() => {
				this.setState({ sent: false });
			}, 5000);
		} catch (error) {
			console.error('Error enviando mensaje:', error);
			this.setState({
				error: 'Error al enviar el mensaje. Intenta de nuevo.',
				sending: false
			});
		}
	};

	handleWhatsAppClick = () => {
		const phone = '522227868288'; // Formato internacional (52 + código de área + número)
		const message = encodeURIComponent('Hola, me interesan los informes sobre los departamentos disponibles en Torre EL.');
		window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
	};

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

					{/* Nueva sección: ¿Quiénes Somos? */}
					<section id='quienes-somos' style={{ marginTop: '50px', marginBottom: '50px' }}>
						<div className='container'>
							<div className='row'>
								<div className='col-xs-12 text-center'>
									<h2>·¿Quiénes Somos?·</h2>
								</div>
							</div>
							<div className='row' style={{ marginTop: '30px' }}>
								<div className='col-xs-12 col-md-8 col-md-offset-2'>
									<div className='panel panel-default'>
										<div className='panel-body' style={{ padding: '30px', fontSize: '16px', lineHeight: '1.8' }}>
											<p>
												<strong>Torre EL</strong> es un edificio moderno ubicado en Zacatelco, Tlaxcala,
												diseñado especialmente para brindarte la comodidad y seguridad que buscas en tu hogar.
											</p>
											<p>
												Nuestros <strong>departamentos VIP</strong> cuentan con espacios amplios, iluminados y funcionales,
												perfectos para estudiantes, profesionales o familias pequeñas que buscan un lugar
												tranquilo y bien ubicado.
											</p>
											<h4 style={{ marginTop: '25px', marginBottom: '15px' }}><i className='fa fa-building'></i> Características de nuestros departamentos:</h4>
											<ul style={{ fontSize: '15px' }}>
												<li><i className='fa fa-check text-success'></i> <strong>Espacios amplios y bien iluminados</strong></li>
												<li><i className='fa fa-check text-success'></i> <strong>Todos los servicios incluidos:</strong> Agua, Luz, Internet de alta velocidad</li>
												<li><i className='fa fa-check text-success'></i> <strong>Seguridad 24/7</strong> con cámaras de vigilancia</li>
												<li><i className='fa fa-check text-success'></i> <strong>Ubicación céntrica</strong> en Zacatelco, cerca de universidades y zonas comerciales</li>
												<li><i className='fa fa-check text-success'></i> <strong>Ambiente tranquilo y familiar</strong></li>
												<li><i className='fa fa-check text-success'></i> <strong>Mantenimiento constante</strong> del edificio y áreas comunes</li>
											</ul>
											<p style={{ marginTop: '20px' }}>
												En <strong>Torre EL</strong>, nos comprometemos a brindarte no solo un espacio para vivir,
												sino un verdadero <em>hogar</em> donde te sientas cómodo, seguro y satisfecho.
											</p>
											<div className='text-center' style={{ marginTop: '30px' }}>
												<button
													onClick={this.handleWhatsAppClick}
													className='btn btn-success btn-lg'
													style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
												>
													<i className='fa fa-whatsapp'></i> Solicitar Informes por WhatsApp
												</button>
											</div>
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
												cancelOnInteraction={false}
												interval={6000}
												fillParent={true}>
												{imageUrls.map((src, index) => (
													<div key={index} data-src={src as string} />
												))}
											</AutoplaySlider>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>

					{/* Sección de Contáctanos mejorada */}
					<section id='contacto' style={{ marginTop: '50px', marginBottom: '50px' }}>
						<div className='container'>
							<div className='row'>
								<div className='col-xs-12 text-center'>
									<h2>·Contáctanos·</h2>
								</div>
							</div>

							<div className='row' style={{ marginTop: '30px' }}>
								{/* Información de contacto */}
								<div className='col-xs-12 col-md-5'>
									<div className='panel panel-info'>
										<div className='panel-heading'>
											<h4><i className='fa fa-info-circle'></i> Información de Contacto</h4>
										</div>
										<div className='panel-body' style={{ fontSize: '15px' }}>
											<p><i className='fa fa-phone'></i> <strong>Celular:</strong> 2227868288</p>
											<p><i className='fa fa-envelope'></i> <strong>Email:</strong> joseluispalillero@hotmail.com</p>
											<p><i className='fa fa-map-marker'></i> <strong>Dirección:</strong> Ciencias de la Salud #16, Tercera Sección Guardia, Zacatelco, Tlaxcala</p>

											<div style={{ marginTop: '25px' }}>
												<button
													onClick={this.handleWhatsAppClick}
													className='btn btn-success btn-block btn-lg'
													style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
												>
													<i className='fa fa-whatsapp'></i> Enviar WhatsApp
												</button>
											</div>
										</div>
									</div>
								</div>

								{/* Formulario de contacto */}
								<div className='col-xs-12 col-md-7'>
									<div className='panel panel-primary'>
										<div className='panel-heading'>
											<h4><i className='fa fa-envelope-o'></i> Envíanos un Mensaje</h4>
										</div>
										<div className='panel-body'>
											{this.state.sent && (
												<div className='alert alert-success'>
													<i className='fa fa-check-circle'></i> ¡Mensaje enviado! Te contactaremos pronto.
												</div>
											)}

											{this.state.error && (
												<div className='alert alert-danger'>
													<i className='fa fa-exclamation-triangle'></i> {this.state.error}
												</div>
											)}

											<form onSubmit={this.handleSendContact}>
												<div className='form-group'>
													<label>Nombre completo <span className='text-danger'>*</span></label>
													<input
														type='text'
														className='form-control'
														value={this.state.contactForm.name}
														onChange={(e) => this.handleContactFormChange('name', e.target.value)}
														placeholder='Tu nombre'
														required
													/>
												</div>

												<div className='form-group'>
													<label>Correo electrónico <span className='text-danger'>*</span></label>
													<input
														type='email'
														className='form-control'
														value={this.state.contactForm.email}
														onChange={(e) => this.handleContactFormChange('email', e.target.value)}
														placeholder='tu@email.com'
														required
													/>
												</div>

												<div className='form-group'>
													<label>Teléfono <span className='text-danger'>*</span></label>
													<input
														type='tel'
														className='form-control'
														value={this.state.contactForm.phone}
														onChange={(e) => this.handleContactFormChange('phone', e.target.value)}
														placeholder='10 dígitos'
														maxLength={10}
														required
													/>
												</div>

												<div className='form-group'>
													<label>Mensaje</label>
													<textarea
														className='form-control'
														rows={4}
														value={this.state.contactForm.message}
														onChange={(e) => this.handleContactFormChange('message', e.target.value)}
														placeholder='Escribe tu mensaje aquí...'
													/>
												</div>

												<button
													type='submit'
													className='btn btn-primary btn-block btn-lg'
													disabled={this.state.sending}
												>
													{this.state.sending ? (
														<><i className='fa fa-spinner fa-spin'></i> Enviando...</>
													) : (
														<><i className='fa fa-paper-plane'></i> Enviar Mensaje</>
													)}
												</button>
											</form>
										</div>
									</div>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		);
	}
}

export default Home;
