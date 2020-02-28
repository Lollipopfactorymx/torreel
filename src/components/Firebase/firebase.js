import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import config from '../../constants/config';

class Firebase {
	constructor() {
		app.initializeApp(config);
		this.auth = app.auth();
		this.db = app.firestore();
	}

	doCreateUserWithEmailAndPassword = (email, password) => this.auth.createUserWithEmailAndPassword(email, password);

	doSignInWithEmailAndPassword = (email, password) => this.auth.signInWithEmailAndPassword(email, password);

	doSignOut = () => this.auth.signOut();

	doPasswordReset = email => this.auth.sendPasswordResetEmail(email);

	doPasswordUpdate = password => this.auth.currentUser.updatePassword(password);

	// *** Merge Auth and DB User API *** //
	onAuthUserListener = (next, fallback) =>
		this.auth.onAuthStateChanged(authUser => {
			if (authUser) {
				this.users().doc(authUser.uid)
					.get().then(doc => {
						if(!doc.exists){
							fallback();
						}
						let dbUser = doc.data();
						// default empty roles
						if (!dbUser.roles) {
							dbUser.roles = {};
						}
						// merge auth and db user
						authUser = {
							uid: authUser.uid,
							email: authUser.email,
							...dbUser,
						};
						next(authUser);
					});
			} else {
				fallback();
			}
		});

	// *** User API ***
	users = () => this.db.collection('users');
}

export default Firebase;
