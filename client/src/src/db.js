import PouchDB from 'pouchdb';

// Create a local database named 'elearning_db'
const localDB = new PouchDB('elearning_db');

export const saveProgress = async (lessonId, status) => {
  try {
    const doc = {
      _id: `progress_${lessonId}`,
      lessonId,
      status, // e.g., 'completed'
      timestamp: new Date().toISOString()
    };
    return await localDB.put(doc);
  } catch (err) {
    if (err.name === 'conflict') {
      // If it exists, update it
      const existing = await localDB.get(`progress_${lessonId}`);
      return await localDB.put({ ...existing, status });
    }
    console.error(err);
  }
};

export default localDB;