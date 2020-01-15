import app from "firebase/app";
import "firebase/auth";

const config = {
  apiKey: "AIzaSyBPisKxyEoVakog8fhpreqtq4It5sTfiNs",
  authDomain: "torreel.firebaseapp.com",
  databaseURL: "https://torreel.firebaseio.com",
  projectId: "torreel",
  storageBucket: "torreel.appspot.com",
  messagingSenderId: "7372108167",
  appId: "1:7372108167:web:092009be648de6c4556322",
  measurementId: "G-0ZGMYN0JMM"
};

class Firebase {
  constructor() {
    app.initializeApp(config);
    this.auth = app.auth();
  }

  doCreateUserWithEmailAndPassword = (email, password) =>
    this.auth.createUserWithEmailAndPassword(email, password);

  doSignInWithEmailAndPassword = (email, password) =>
    this.auth.signInWithEmailAndPassword(email, password);

  doSignOut = () => this.auth.signOut();

  doPasswordUpdate = password => this.auth.currentUser.updatePassword(password);
}

export default Firebase;
