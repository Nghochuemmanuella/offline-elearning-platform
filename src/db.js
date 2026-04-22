import PouchDB from 'pouchdb/dist/pouchdb.js';

// 1. Local Database
const localDB = new PouchDB('elearning_db');

// 2. Remote Database URL
// Note: We use the string directly in the sync function to avoid ReferenceErrors
const remoteDBURL = 'http://admin:ella123@127.0.0.1:5984/edubridge_remote';

export const startSync = () => {
  console.log("🚀 EduBridge Sync Engine: Initializing...");

  // We use remoteDBURL (the string) here to ensure it is defined
  const syncHandler = localDB.sync(remoteDBURL, {
    live: true,   // Keeps the connection open
    retry: true,  // Automatically reconnects when Bamenda network returns
    continuous: true
  })
  .on('change', (info) => {
    console.log("🔄 DATA UPDATE: New modules or progress received!", info);
  })
  .on('paused', (err) => {
    if (err) {
      console.log("📡 OFFLINE: Local changes will be queued.");
    } else {
      console.log("☁️ SYNCED: All data is currently up to date.");
    }
  })
  .on('active', () => {
    console.log("⚡ ONLINE: Syncing local changes to campus server...");
  })
  .on('denied', (err) => {
    console.error("🚫 PERMISSION DENIED: Check CouchDB credentials.", err);
  })
  .on('error', (err) => {
    console.error("❌ CRITICAL SYNC ERROR:", err);
  });

  return syncHandler;
};

export const saveProgress = async (lessonId, status, userId) => {
  try {
    const docId = `progress_${userId}_${lessonId}`; 
    
    const doc = {
      _id: docId,
      type: 'progress', // Added type for better filtering later
      lessonId,
      userId, 
      status, 
      timestamp: new Date().toISOString()
    };
    return await localDB.put(doc);
  } catch (err) {
    if (err.name === 'conflict') {
      const docId = `progress_${userId}_${lessonId}`;
      const existing = await localDB.get(docId);
      return await localDB.put({ 
        ...existing, 
        status, 
        timestamp: new Date().toISOString() 
      });
    }
    console.error("Error saving progress:", err);
  }
};

export const getLocalUser = async () => {
  try {
    const user = await localDB.get('user_profile');
    return user;
  } catch (err) {
    if (err.status === 404) {
      return null;
    }
    console.error("Error fetching local user:", err);
    throw err;
  }
};

export default localDB;

// Debugging tools for your browser console
window.localDB = localDB;
window.remoteDBURL = remoteDBURL;