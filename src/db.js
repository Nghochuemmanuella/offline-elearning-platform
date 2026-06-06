import PouchDB from 'pouchdb/dist/pouchdb.js';

// 1. Local Database
const localDB = new PouchDB('elearning_db');

// 2. Remote Database URL
// Note: We use the string directly in the sync function to avoid ReferenceErrors
const remoteDBURL = import.meta.env.VITE_COUCHDB_URL;
 export const startSync = (onStatusChange) => {
  if (!remoteDBURL) {
    console.warn("⚠️ No remote DB URL configured. Running in local-only mode.");
    if (onStatusChange) onStatusChange('offline');
    return;
  }

  const syncHandler = localDB.sync(remoteDBURL, {
    live: true,
    retry: true,
    continuous: true
  })
  .on('change', (info) => {
    if (onStatusChange) onStatusChange('syncing');
    resolveConflicts();
  })
  .on('paused', (err) => {
    if (err) {
      if (onStatusChange) onStatusChange('offline');
    } else {
      if (onStatusChange) onStatusChange('synced');
    }
  })
  .on('active', () => {
    if (onStatusChange) onStatusChange('syncing');
  })
  .on('denied', (err) => {
    if (onStatusChange) onStatusChange('offline');
  })
  .on('error', (err) => {
    if (onStatusChange) onStatusChange('offline');
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
// ── AUTOMATIC CONFLICT RESOLUTION ENGINE ──
export const resolveConflicts = async () => {
  try {
    const result = await localDB.allDocs({ include_docs: true, conflicts: true });
    
    const conflictedDocs = result.rows.filter(row => 
      row.doc._conflicts && row.doc._conflicts.length > 0
    );

    if (conflictedDocs.length === 0) return;

    console.log(`⚔️ EduBridge: Found ${conflictedDocs.length} conflict(s). Resolving...`);

    for (const row of conflictedDocs) {
      const doc = row.doc;
      const conflictRevs = doc._conflicts;

      // 1. Fetch all conflicting versions
      const conflictDocs = await Promise.all(
        conflictRevs.map(rev => localDB.get(doc._id, { rev }))
      );

      // 2. Pick the winner — most recent by timestamp
      const allVersions = [doc, ...conflictDocs];
      const winner = allVersions.reduce((a, b) => {
        const timeA = new Date(a.completedAt || a.updatedAt || a.createdAt || 0);
        const timeB = new Date(b.completedAt || b.updatedAt || b.createdAt || 0);
        return timeA > timeB ? a : b;
      });

      // 3. Delete all losing versions
      const losers = conflictDocs.filter(d => d._rev !== winner._rev);
      await Promise.all(
        losers.map(loser => localDB.remove(loser._id, loser._rev))
      );

      console.log(`✅ Conflict resolved for: ${doc._id} — kept version from ${winner.completedAt || winner.updatedAt || winner.createdAt}`);
    }

  } catch (err) {
    console.error("❌ Conflict Resolution Error:", err);
  }
};

// Debugging tools for your browser console
window.localDB = localDB;
