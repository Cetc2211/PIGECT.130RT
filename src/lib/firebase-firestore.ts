// STUB: Modo 100% local — Sin Firebase/Google Cloud
// Todas las funciones exportadas retornan no-ops para que react-firebase-hooks y el resto de la app compilen sin errores.
'use client';

const noop = function () {};

const mockDocRef: any = {
  id: 'mock',
  get: async () => ({ exists: () => false, data: () => ({}), id: 'mock' }),
  set: async () => {},
  update: async () => {},
  delete: async () => {},
  withConverter: () => mockDocRef,
};

const mockQuery: any = {
  where: function () { return mockQuery; },
  orderBy: function () { return mockQuery; },
  limit: function () { return mockQuery; },
  get: async () => ({ docs: [], size: 0, empty: true, forEach: noop, docChanges: () => [] }),
  onSnapshot: function () { return function () {}; },
};

const mockCollectionRef: any = {
  id: 'mock-collection',
  doc: function (id?: string) { return { ...mockDocRef, id: id || 'mock' }; },
  add: async () => ({ id: 'mock-new-doc' }),
  get: async () => ({ docs: [], size: 0, empty: true, forEach: noop }),
  where: function () { return mockQuery; },
  orderBy: function () { return mockQuery; },
  limit: function () { return mockQuery; },
  onSnapshot: function () { return function () {}; },
};

function collection(..._args: any[]) { return mockCollectionRef; }
function doc(..._args: any[]) { return mockDocRef; }
function getDoc(..._args: any[]) { return Promise.resolve({ exists: () => false, data: () => ({}), id: 'mock' }); }
function getDocs(..._args: any[]) { return Promise.resolve({ docs: [], size: 0, empty: true, forEach: noop, docChanges: () => [] }); }
function getDocsFromServer(..._args: any[]) { return getDocs(); }
function getDocsFromCache(..._args: any[]) { return getDocs(); }
function getDocFromServer(..._args: any[]) { return getDoc(); }
function getDocFromCache(..._args: any[]) { return getDoc(); }
function setDoc(..._args: any[]) { return Promise.resolve(); }
function addDoc(..._args: any[]) { return Promise.resolve({ id: 'mock-new-doc' }); }
function updateDoc(..._args: any[]) { return Promise.resolve(); }
function deleteDoc(..._args: any[]) { return Promise.resolve(); }
function onSnapshot(..._args: any[]) { return function () {}; }
function query(ref: any, ..._constraints: any[]) { return ref || mockQuery; }
function where(field: string, op: string, value: any) { return { _type: 'where', field, op, value }; }
function orderBy(field: string, dir?: string) { return { _type: 'orderBy', field, dir }; }
function limit(n: number) { return { _type: 'limit', n }; }
function serverTimestamp() { return { _type: 'serverTimestamp' }; }
function waitForPendingWrites(..._args: any[]) { return Promise.resolve(); }
function refEqual(_a: any, _b: any) { return false; }
function queryEqual(_a: any, _b: any) { return false; }

const Timestamp = {
  now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, toDate: () => new Date() }),
  fromDate: (date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, toDate: () => date }),
};

function writeBatch(_db: any) {
  return { set: noop, update: noop, delete: noop, commit: async () => {} };
}

function runTransaction(_db: any, fn: any) {
  return Promise.resolve(fn({
    get: async () => ({ exists: () => false, data: () => ({}) }),
    set: noop, update: noop, delete: noop,
  }));
}

function increment(n: number) { return { _type: 'increment', n }; }
function arrayUnion(...elements: any[]) { return { _type: 'arrayUnion', elements }; }
function arrayRemove(...elements: any[]) { return { _type: 'arrayRemove', elements }; }

export {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  getDocsFromCache,
  getDocFromServer,
  getDocFromCache,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  runTransaction,
  increment,
  arrayUnion,
  arrayRemove,
  waitForPendingWrites,
  refEqual,
  queryEqual,
};
