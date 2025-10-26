const mongoose = require('mongoose');

async function dropInvalidIndex() {
  try {
    // Connect to MongoDB without specifying DB to list all databases
    await mongoose.connect('mongodb://localhost:27017');
    console.log('Connected to MongoDB');

    const adminDb = mongoose.connection.db;
    const adminClient = adminDb.admin();

    // List all databases
    const dbs = await adminClient.listDatabases();
    console.log('All databases:', dbs.databases.map(db => db.name));

    let fixed = false;

    // Check each database for courses collection
    for (const dbInfo of dbs.databases) {
      const dbName = dbInfo.name;
      if (dbName === 'admin' || dbName === 'config' || dbName === 'local') continue;

      console.log(`\nChecking database: ${dbName}`);
      await mongoose.connection.useDb(dbName);
      const db = mongoose.connection.db;

      const allCollections = await db.listCollections().toArray();
      console.log('Collections in', dbName, ':', allCollections.map(c => c.name));

      const coursesCollection = allCollections.find(c => c.name === 'courses');
      if (coursesCollection) {
        console.log('Found courses collection in', dbName);

        const indexes = await db.collection('courses').indexes();
        console.log('Indexes in', dbName + '.courses:', indexes);

        const invalidIndex = indexes.find(i => i.name === 'course_code_1');
        if (invalidIndex) {
          await db.collection('courses').dropIndex('course_code_1');
          console.log('Dropped invalid index in', dbName);
          fixed = true;
        } else {
          console.log('Invalid index not found in', dbName);
        }

        // List updated indexes
        const newIndexes = await db.collection('courses').indexes();
        console.log('Updated indexes in', dbName + '.courses:', newIndexes);
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

    const testCourses = testCollections.find(c => c.name === 'courses');
    if (testCourses) {
      console.log('Found courses collection in test');

      const testIndexes = await testDb.collection('courses').indexes();
      console.log('Indexes in test.courses:', testIndexes);

      const testInvalidIndex = testIndexes.find(i => i.name === 'course_code_1');
      if (testInvalidIndex) {
        await testDb.collection('courses').dropIndex('course_code_1');
        console.log('Dropped invalid index in test');
        fixed = true;
      } else {
        console.log('Invalid index not found in test');
      }

      const testNewIndexes = await testDb.collection('courses').indexes();
      console.log('Updated indexes in test.courses:', testNewIndexes);
    } else {
      console.log('Courses collection not found in test DB');
    }

    await testConnection.close();
    console.log('Disconnected from test connection');

    if (!fixed) {
      console.log('No invalid index found in any database');
    }
  } catch (error) {
    console.error('Error dropping index:', error);
  }
}

dropInvalidIndex();
