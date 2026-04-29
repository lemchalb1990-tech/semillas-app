import Dexie from 'dexie';

const db = new Dexie('SemillasDB');

db.version(1).stores({
  cache:     'url, updatedAt',
  syncQueue: '++id, createdAt',
});

export default db;
