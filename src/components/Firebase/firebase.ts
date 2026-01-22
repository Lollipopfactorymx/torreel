import { initializeApp, FirebaseApp } from 'firebase/app';
import {
	Auth,
	getAuth,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	sendPasswordResetEmail,
	updatePassword,
	onAuthStateChanged,
	User
} from 'firebase/auth';
import {
	Firestore,
	getFirestore,
	collection,
	doc,
	getDoc,
	getDocs,
	setDoc,
	updateDoc,
	addDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit,
	onSnapshot,
	CollectionReference,
	DocumentReference,
	QueryConstraint
} from 'firebase/firestore';

import config from '../../constants/config';

class Firebase {
	app: FirebaseApp;
	auth: Auth;
	db: Firestore;

	constructor() {
		this.app = initializeApp(config);
		this.auth = getAuth(this.app);
		this.db = getFirestore(this.app);
	}

	// *** Auth API ***
	doCreateUserWithEmailAndPassword = (email: string, password: string) =>
		createUserWithEmailAndPassword(this.auth, email, password);

	doSignInWithEmailAndPassword = (email: string, password: string) =>
		signInWithEmailAndPassword(this.auth, email, password);

	doSignOut = () => signOut(this.auth);

	doPasswordReset = (email: string) => sendPasswordResetEmail(this.auth, email);

	doPasswordUpdate = (password: string) => {
		if (this.auth.currentUser) {
			return updatePassword(this.auth.currentUser, password);
		}
		return Promise.reject(new Error('No user logged in'));
	};

	// *** Merge Auth and DB User API ***
	onAuthUserListener = (next: Function, fallback: Function) =>
		onAuthStateChanged(this.auth, async (authUser: User | null) => {
			if (authUser) {
				try {
					const userDoc = await getDoc(doc(this.db, 'users', authUser.uid));
					if (!userDoc.exists()) {
						fallback();
						return;
					}
					let dbUser = userDoc.data();
					if (!dbUser.roles) {
						dbUser.roles = {};
					}
					const mergedUser = {
						uid: authUser.uid,
						email: authUser.email,
						...dbUser,
					};
					next(mergedUser);
				} catch (error) {
					console.error('Error fetching user data:', error);
					fallback();
				}
			} else {
				fallback();
			}
		});

	// *** User API ***
	users = () => collection(this.db, 'users');

	// *** Firestore Helper Methods ***
	collection = (path: string) => collection(this.db, path);

	doc = (collectionPath: string, docId: string) => doc(this.db, collectionPath, docId);

	getDoc = (docRef: DocumentReference) => getDoc(docRef);

	getDocs = (collectionRef: CollectionReference) => getDocs(collectionRef);

	setDoc = (docRef: DocumentReference, data: any, options?: { merge?: boolean }) =>
		setDoc(docRef, data, options || {});

	updateDoc = (docRef: DocumentReference, data: any) => updateDoc(docRef, data);

	addDoc = (collectionRef: CollectionReference, data: any) => addDoc(collectionRef, data);

	deleteDoc = (docRef: DocumentReference) => deleteDoc(docRef);

	query = (collectionRef: CollectionReference, ...queryConstraints: QueryConstraint[]) =>
		query(collectionRef, ...queryConstraints);

	where = where;
	orderBy = orderBy;
	limit = limit;
	onSnapshot = onSnapshot;
}

export default Firebase;
