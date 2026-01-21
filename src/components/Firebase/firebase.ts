import app from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import config from '../../constants/config';

class Firebase {
	auth: app.auth.Auth;
	db: app.firestore.Firestore;

	constructor() {
		app.initializeApp(config);
		this.auth = app.auth();
		this.db = app.firestore();
	}

	doCreateUserWithEmailAndPassword = (email: string, password: string) => this.auth.createUserWithEmailAndPassword(email, password);

	doSignInWithEmailAndPassword = (email: string, password: string) => this.auth.signInWithEmailAndPassword(email, password);

	doSignOut = () => this.auth.signOut();

	doPasswordReset = (email: string) => this.auth.sendPasswordResetEmail(email);

	doPasswordUpdate = (password: string) => (this.auth.currentUser as any).updatePassword(password);

	// *** Merge Auth and DB User API *** //
	onAuthUserListener = (next: Function, fallback: Function) =>
		this.auth.onAuthStateChanged((authUser: any) => {
			if (authUser) {
				this.users().doc(authUser.uid)
					.get().then((doc: any) => {
						if (!doc.exists) {
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
