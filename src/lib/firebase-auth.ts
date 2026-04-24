// STUB: Modo 100% local — Sin Firebase/Google Cloud
// Todas las funciones exportadas retornan no-ops para que react-firebase-hooks compile sin errores.
'use client';

const noopAsync = async (..._args: any[]) => {};
const noopFn = (..._args: any[]) => {};
const localUser = { uid: 'local', email: 'local@local', displayName: 'Local User' };

function getAuth(..._args: any[]) {
  return {
    currentUser: null,
    onAuthStateChanged(cb: (u: any) => void) { try { cb(null); } catch {} return () => {}; },
    signInWithEmailAndPassword: async () => ({ user: localUser }),
    signOut: async () => {},
    getRedirectResult: async () => null,
  };
}

const auth = {
  currentUser: null,
  onAuthStateChanged(cb: (u: any) => void) { try { cb(null); } catch {} return () => {}; },
  signInWithEmailAndPassword: async () => ({ user: localUser }),
  signOut: async () => {},
  getRedirectResult: async () => null,
};

function signInWithEmailAndPassword(..._args: any[]) { return Promise.resolve({ user: localUser }); }
function signOut(..._args: any[]) { return Promise.resolve(); }
function getIdToken(..._args: any[]) { return Promise.resolve(null); }
function onAuthStateChanged(_a: any, cb: (u: any) => void) { try { cb(null); } catch {} return () => {}; }
function onIdTokenChanged(_a: any, cb: (u: any) => void) { try { cb(null); } catch {} return () => {}; }

function createUserWithEmailAndPassword(..._args: any[]) { return Promise.resolve({ user: localUser }); }
function sendEmailVerification(..._args: any[]) { return Promise.resolve(); }
function sendPasswordResetEmail(..._args: any[]) { return Promise.resolve(); }
function sendSignInLinkToEmail(..._args: any[]) { return Promise.resolve(); }
function signInWithEmailLink(..._args: any[]) { return Promise.resolve({ user: localUser }); }
function signInWithPopup(..._args: any[]) { return Promise.resolve({ user: localUser }); }
function updateEmail(..._args: any[]) { return Promise.resolve(); }
function updatePassword(..._args: any[]) { return Promise.resolve(); }
function updateProfile(..._args: any[]) { return Promise.resolve(); }
function verifyBeforeUpdateEmail(..._args: any[]) { return Promise.resolve(); }

class GoogleAuthProvider { credential: any = null; }
class FacebookAuthProvider { credential: any = null; }
class GithubAuthProvider { credential: any = null; }
class TwitterAuthProvider { credential: any = null; }
class OAuthProvider { constructor(public _providerId: string) {} credential: any = null; }
class EmailAuthProvider { credential(email: string, pw: string) { return {}; } static credential(email: string, pw: string) { return {}; } }

export {
  auth,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  getIdToken,
  onAuthStateChanged,
  onIdTokenChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  updateEmail,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  EmailAuthProvider,
};
