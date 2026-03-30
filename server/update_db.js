const db = require('./db');

async function updateSchema() {
    try {
        console.log("Adding treatment_name to treatment_plan_items...");
        await db.execute("ALTER TABLE treatment_plan_items ADD COLUMN treatment_name VARCHAR(255) DEFAULT NULL AFTER treatment_id");
        console.log("Success!");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log("Column already exists.");
            process.exit(0);
        }
        console.error(err);
        process.exit(1);
    }
}

updateSchema();
