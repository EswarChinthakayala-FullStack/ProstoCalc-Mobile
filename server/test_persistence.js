const db = require('./db');

async function testPersistence() {
    try {
        console.log("Starting persistence test...");
        const testName = "TEST_" + Math.random().toString(36).substring(7);
        
        console.log(`Inserting test treatment: ${testName}`);
        const [insertRes] = await db.execute(
            'INSERT INTO treatment_catalog (name, category, default_cost) VALUES (?, ?, ?)',
            [testName, 'TEST', 99]
        );
        const newId = insertRes.insertId;
        console.log(`Inserted with ID: ${newId}`);
        
        console.log("Reading it back...");
        const [rows] = await db.execute('SELECT * FROM treatment_catalog WHERE id = ?', [newId]);
        
        if (rows.length > 0) {
            console.log("SUCCESS: Data retrieved correctly.");
            console.log(rows[0]);
        } else {
            console.log("FAILURE: Data not found after insert.");
        }
        
        // Cleanup
        await db.execute('DELETE FROM treatment_catalog WHERE id = ?', [newId]);
        console.log("Cleanup complete.");
        process.exit(0);
    } catch (err) {
        console.error("ERROR during test:", err.message);
        process.exit(1);
    }
}

testPersistence();
