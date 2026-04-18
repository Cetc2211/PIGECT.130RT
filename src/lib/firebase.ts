// ============================================
// Firebase Stubs — 100% Local Mode
// ============================================
// PIGEC-130 runs entirely in the browser with localStorage + IndexedDB.
// This file exports stub objects so that existing imports across the app
// compile without errors while the real Firebase SDK is never loaded.

export const auth = { currentUser: null, onAuthStateChanged: () => {}, signOut: async () => {} };
export const db = null;
export const storage = null;
export const app = { name: '[LOCAL]', options: {} };
