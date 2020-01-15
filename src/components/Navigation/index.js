import React from "react";
import { Link } from "react-router-dom";
import * as ROUTES from "../../constants/routes";
import menulogo from "../../assets/images/menulogo.png";

const Navigation = () => (
    <nav id="main-menu" className="navbar navbar-default navbar-fixed-top bg00">
    <div className="container">
      <div className="navbar-header">
        <button type="button" className="navbar-toggle collapsed color01" data-toggle="collapse"
          data-target="#menuprincipal" aria-expanded="false">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
        <Link className="navbar-brand" to={ROUTES.HOME}><img src={menulogo} alt="logotorreEl" /></Link>
      </div>

      <div className="collapse navbar-collapse" id="menuprincipal">
        <div className="row">
          <ul className="nav navbar-nav mainmenu">
            <li className="dropdown">
              <Link to={ROUTES.HOME} className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true"
                aria-expanded="false">¿Quiénes somos? <span className="marker"></span></Link>
              <ul className="dropdown-menu">
                <li><a href="login.html">Misión</a></li>
                <li><a href="#">Visión</a></li>
              </ul>
            </li>
            <li className="dropdown">
              <Link to={ROUTES.SIGN_IN} className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true"
                aria-expanded="false">Inicia sesión <span className="marker"></span></Link>
              <ul className="dropdown-menu">
                <li><a href="login.html">Iniciar sesión</a></li>
                <li><a href="#">Cerrar sesión</a></li>
              </ul>
            </li>
            <li><a href="#">Regístrate</a></li>
            <li><a href="#">Mapa</a></li>
            <form className="navbar-form navbar-right">
              <div className="form-group">
                <label className="sr-only" htmlFor="exampleInputAmount">Amount (in dollars)</label>
                <div className="input-group">
                  <div className="input-group-addon bg07"><i className="fa fa-search fa-lg color03"></i></div>
                  <input type="text" className="form-control bg07" id="exampleInputAmount" placeholder="Buscar"></input>
                </div>
              </div>
            </form>
          </ul>
        </div>
        <div className="row">
          <ul className="nav navbar-nav socialmenu">
            <li><a href="#"><i className="fa fa-facebook fa-lg" aria-hidden="true"></i></a></li>
            <li><a href="#"><i className="fa fa-twitter fa-lg" aria-hidden="true"></i></a></li>
            <li><a href="#"><i className="fa fa-instagram fa-lg" aria-hidden="true"></i></a></li>
          </ul>
        </div>
      </div>
    </div>
  </nav>
);

export default Navigation;
