import React from "react";
import ReactDOM from "react-dom";
import "./assets/css/bootstrap.css";
import "./assets/fonts/glyphicons-halflings-regular.eot";
import "./assets/fonts/glyphicons-halflings-regular.woff";
import "./assets/fonts/glyphicons-halflings-regular.woff2";
import "./assets/fonts/glyphicons-halflings-regular.ttf";
import "./assets/fonts/glyphicons-halflings-regular.svg";
import "./assets/images/fondorayado.jpg"
import "./assets/css/custom.css";
import "./assets/css/menu.css";
import "./assets/css/sidebar.css";
import App from "./components/App";
import Firebase, { FirebaseContext } from "./components/Firebase";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(
  <FirebaseContext.Provider value={new Firebase()}>
    <App />
  </FirebaseContext.Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
