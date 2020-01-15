import React from "react";
import HeaderTE from "../HeaderTE";
import aguaImg from '../../assets/images/agua.png';
import luzImg from '../../assets/images/luz.png';
import internetImg from '../../assets/images/internet.png';
import vigilanciaImg from '../../assets/images/vigilancia.png';

class Home extends React.Component {
  render() {
    return (
      <div>
        <HeaderTE />

        <div className="fondo-rayas container-fluid">
          <section id="servicios">
            <div className="container">
              <div className="row">
                <h2 className="text-center">
                  ·Solo nos queda una habitación disponible para caballero,
                  solicita informes al celular 2227806034
                </h2>
              </div>
              <br />
              <br />
              <div className="row">
                <h2 className="text-center">
                  ·Revisa nuestras reglas internas en el siguiente link - 
                  <a href="https://www.dropbox.com/s/qk57vskxkq0l23m/Reglas%20de%20torre%20EL.docx?dl=0">
                    Reglas internas
                  </a>
                </h2>
              </div>
              <div className="row">
                <div className="col-xs-12 text-center">
                  <h2>·Servicios·</h2>
                </div>
                <div className="col-xs-6 col-sm-3">
                  <div className="thumbnail">
                    <img
                      src={aguaImg}
                      className="img-circle img-thumbnail"
                      alt="..."
                    />
                    <div className="caption text-center">
                      <h3>Agua</h3>
                    </div>
                  </div>
                </div>
                <div className="col-xs-6 col-sm-3">
                  <div className="thumbnail">
                    <img
                      src={luzImg}
                      className="img-circle img-thumbnail"
                      alt="..."
                    />
                    <div className="caption text-center">
                      <h3>Luz</h3>
                    </div>
                  </div>
                </div>
                <div className="col-xs-6 col-sm-3">
                  <div className="thumbnail">
                    <img
                      src={internetImg}
                      className="img-circle img-thumbnail"
                      alt="..."
                    />
                    <div className="caption text-center">
                      <h3>Internet</h3>
                    </div>
                  </div>
                </div>
                <div className="col-xs-6 col-sm-3">
                  <div className="thumbnail">
                    <img
                      src={vigilanciaImg}
                      className="img-circle img-thumbnail"
                      alt="..."
                    />
                    <div className="caption text-center">
                      <h3>Camaras de Vigilancia</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="galeria">
            <div className="container">
              <div className="row">
                <div className="col-xs-12 text-center">
                  <h2>·Galería de imágenes·</h2>

                  <div className="col-xs-12 col-sm-12">
                    <center>
                      <div className="galleria">
                        <img
                          src="/fotos/IMAG0221.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/1.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/2.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/3.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/4.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/5.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/6.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/7.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/8.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0240.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0241.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0242.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0243.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0244.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0245.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0246.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0248.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0249.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0250.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                        <img
                          src="/fotos/IMAG0251.jpg"
                          className="img-responsive"
                          data-title="Another title"
                          data-description="My <i>HTML</i> description"
                        />
                      </div>
                    </center>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="contacto">
            <div className="container">
              <div className="row">
                <h2 className="text-center">·Contacto·</h2>
                Celular: 2227806034
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
