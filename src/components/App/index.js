import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Navigation from "../Navigation";
import * as ROUTES from '../../constants/routes';

import FooterTE from "../FooterTE";

import HomePage from '../Home'
import SignIn from "../SignIn";

class App extends React.Component {
  componentDidMount() {
    const script = document.createElement("script");
    script.src = "https://use.fontawesome.com/fe573de431.js";
    script.async = true;
    document.head.appendChild(script);
  }
  render() {
    return (
      <div id="wrapper">
        <Router>
          <Navigation />

          <Route exact path={ROUTES.LANDING} component={HomePage} />
          <Route path={ROUTES.HOME} component={HomePage} />
          <Route path={ROUTES.SIGN_IN} component={SignIn}/>

        </Router>
        <FooterTE/>
      </div>
    );
  }
}

export default App;
