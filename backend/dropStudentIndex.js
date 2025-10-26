const mongoose = require('mongoose');

async function dropInvalidStudentIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017');
    console.log('Connected to MongoDB');

    const adminDb = mongoose.connection.db;
    const adminClient = adminDb.admin();

    // List all databases
    const dbs = await adminClient.listDatabases();
    console.log('All databases:', dbs.databases.map(db => db.name));

    let fixed = false;

    // Check each database for students collection
    for (const dbInfo of dbs.databases) {
      const dbName = dbInfo.name;
      if (dbName === 'admin' || dbName === 'config' || dbName === 'local') continue;

      console.log(`\nChecking database: ${dbName}`);
      await mongoose.connection.useDb(dbName);
      const db = mongoose.connection.db;

      const allCollections = await db.listCollections().toArray();
      console.log('Collections in', dbName, ':', allCollections.map(c => c.name));

      const studentsCollection = allCollections.find(c => c.name === 'students');
      if (studentsCollection) {
        console.log('Found students collection in', dbName);

        const indexes = await db.collection('students').indexes();
        console.log('Indexes in', dbName + '.students:', indexes);

        const invalidIndex = indexes.find(i => i.name === 'student_id_1');
        if (invalidIndex) {
          await db.collection('students').dropIndex('student_id_1');
          console.log('Dropped invalid index in', dbName);
          fixed = true;
        } else {
          console.log('Invalid index not found in', dbName);
        }

        // List updated indexes
        const newIndexes = await db.collection('students').indexes();
        console.log('Updated indexes in', dbName + '.students:', newIndexes);
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected from main connection');

    // Explicitly check 'test' database as per error log using separate connection
    console.log('\nChecking test database explicitly');
    const testConnection = mongoose.createConnection('mongodb://localhost:27017/test');
    await testConnection.asPromise();
    console.log('Connected to test database');

    const testDb = testConnection.db;
    const testCollections = await testDb.listCollections().toArray();
    console.log('Collections in test DB:', testCollections.map(c => c.name));

    const testStudents = testCollections.find(c => c.name === 'students');
    if (testStudents) {
      console.log('Found students collection in test');

      const testIndexes = await testDb.collection('students').indexes();
      console.log('Indexes in test.students:', testIndexes);

      const testInvalidIndex = testIndexes.find(i => i.name === 'student_id_1');
      if (testInvalidIndex) {
        await testDb.collection('students').dropIndex('student_id_1');
        console.log('Dropped invalid index in test');
        fixed = true;
      } else {
        console.log('Invalid index not found in test');
      }

      const testNewIndexes = await testDb.collection('students').indexes();
      console.log('Updated indexes in test.students:', testNewIndexes);
    } else {
      console.log('Students collection not found in test DB');
    }

    await testConnection.close();
    console.log('Disconnected from test connection');

    if (!fixed) {
      console.log('No invalid index found in any database');
    } else {
      console.log('Invalid student index dropped successfully where found.');
    }
  } catch (error) {
    console.error('Error dropping student index:', error);
  }
}

dropInvalidStudentIndex();
