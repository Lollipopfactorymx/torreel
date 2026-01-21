import React from "react";
import { createRoot } from "react-dom/client";
import "./assets/css/bootstrap.css";
// ... other imports
import "./assets/css/custom.css";
import "./assets/css/menu.css";
import "./assets/css/sidebar.css";
import App from "./components/App";
import Firebase, { FirebaseContext } from "./components/Firebase";
import * as serviceWorker from "./serviceWorker";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <FirebaseContext.Provider value={new Firebase()}>
      <App />
    </FirebaseContext.Provider>
  );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
