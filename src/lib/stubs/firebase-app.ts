// Stub for firebase/app — prevents SDK initialization errors in serverless env
export const initializeApp = () => ({ name: '[DEFAULT]', options: {} });
export const getApps = () => [];
export const getApp = () => ({ name: '[DEFAULT]', options: {} });
export const deleteApp = async () => undefined;
