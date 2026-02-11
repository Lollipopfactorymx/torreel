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

// Wrapper compat para soportar el patrón firebase.db.collection() de Firebase v8
function createDocWrapper(db: Firestore, collectionPath: string, docId: string) {
	const docRef = doc(db, collectionPath, docId);
	return Object.assign(docRef, {
		get: () => getDoc(docRef),
		set: (data: any, options?: any) => setDoc(docRef, data, options || {}),
		update: (data: any) => updateDoc(docRef, data),
		delete: () => deleteDoc(docRef),
	});
}

function createCollectionWrapper(db: Firestore, path: string) {
	const colRef = collection(db, path);
	return {
		get: () => getDocs(colRef),
		doc: (docId?: string) => {
			if (!docId) {
				// Generar un nuevo doc ID (para .doc().id)
				const newDocRef = doc(colRef);
				return Object.assign(newDocRef, {
					get: () => getDoc(newDocRef),
					set: (data: any, options?: any) => setDoc(newDocRef, data, options || {}),
					update: (data: any) => updateDoc(newDocRef, data),
					delete: () => deleteDoc(newDocRef),
				});
			}
			return createDocWrapper(db, path, docId);
		},
		add: (data: any) => addDoc(colRef, data),
		where: (...args: any[]) => {
			let q = query(colRef, where(args[0], args[1], args[2]));
			return {
				get: () => getDocs(q),
				where: (...args2: any[]) => {
					q = query(colRef, where(args[0], args[1], args[2]), where(args2[0], args2[1], args2[2]));
					return {
						get: () => getDocs(q),
						orderBy: (field: string, direction?: any) => ({
							get: () => getDocs(query(colRef, where(args[0], args[1], args[2]), where(args2[0], args2[1], args2[2]), orderBy(field, direction))),
						}),
					};
				},
				orderBy: (field: string, direction?: any) => ({
					get: () => getDocs(query(colRef, where(args[0], args[1], args[2]), orderBy(field, direction))),
				}),
				limit: (n: number) => ({
					get: () => getDocs(query(colRef, where(args[0], args[1], args[2]), limit(n))),
				}),
			};
		},
		orderBy: (field: string, direction?: any) => ({
			get: () => getDocs(query(colRef, orderBy(field, direction))),
		}),
		onSnapshot: (callback: any) => onSnapshot(colRef, callback),
		ref: colRef,
	};
}

class Firebase {
	app: FirebaseApp;
	auth: Auth;
	db: any; // Firestore con wrapper compat

	constructor() {
		this.app = initializeApp(config);
		this.auth = getAuth(this.app);
		const firestore = getFirestore(this.app);

		// Crear proxy que soporta tanto API modular como compat
		this.db = Object.assign(firestore, {
			collection: (path: string) => createCollectionWrapper(firestore, path),
		});
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
	// Wrapper compat para soportar patrones de Firebase v8: .get(), .doc().get/set/update()
	users = () => {
		const colRef = collection(this.db, 'users');
		const db = this.db;
		return Object.assign(colRef, {
			get: () => getDocs(colRef),
			doc: (docId: string) => {
				const docRef = doc(db, 'users', docId);
				return Object.assign(docRef, {
					get: () => getDoc(docRef),
					set: (data: any, options?: any) => setDoc(docRef, data, options || {}),
					update: (data: any) => updateDoc(docRef, data),
					delete: () => deleteDoc(docRef),
				});
			},
		});
	};

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
