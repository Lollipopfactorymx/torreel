import React from "react";

class SignIn extends React.Component {
  render() {
    return (
      <header id="login">
        <div className="container-fluid vertical-center">
          <img
            src="images/user-default.jpg"
            className="img-circle center-block"
            alt="img"
          />
          <form id="login-form">
            <div className="form-group">
              <label className="sr-only" htmlFor="exampleInputEmail3">
                Email address
              </label>
              <input
                type="email"
                className="form-control bg03"
                id="exampleInputEmail3"
                placeholder="Correo"
              />
            </div>
            <div className="form-group">
              <label className="sr-only" htmlFor="exampleInputPassword3">
                Password
              </label>
              <input
                type="password"
                className="form-control bg03"
                id="exampleInputPassword3"
                placeholder="Contraseña"
              />
            </div>
            <button type="submit" className="btn center-block bg00 color01">
              <img
                src="images/paper-plane-icon.png"
                alt=""
                className="img-responsive"
              />{" "}
              Enviar
            </button>
          </form>
        </div>
      </header>
    );
  }
}

export default SignIn;
