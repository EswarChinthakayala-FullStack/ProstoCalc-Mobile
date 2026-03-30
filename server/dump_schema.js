const db = require('./db');

async function dumpSchema() {
    try {
        console.log("Checking tables...");
        const [tables] = await db.query('SHOW TABLES');
        console.log("Tables found:", tables.map(t => Object.values(t)[0]));

        for (const t of tables) {
            const tableName = Object.values(t)[0];
            const [columns] = await db.query(`DESCRIBE ${tableName}`);
            console.log(`\n--- ${tableName} ---`);
            columns.forEach(c => console.log(`${c.Field}: ${c.Type} (${c.Null})`));
        }
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

dumpSchema();
