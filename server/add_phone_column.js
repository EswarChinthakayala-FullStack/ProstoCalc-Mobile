const db = require('./db');

async function fixSchema() {
    try {
        console.log("Checking and adding 'phone' column to 'patients' table...");
        try {
            await db.execute("ALTER TABLE patients ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email");
            console.log("Added 'phone' to patients.");
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') {
                console.log("'phone' already exists in patients.");
            } else {
                throw e;
            }
        }

        console.log("Checking and adding 'phone' column to 'dentists' table...");
        try {
            await db.execute("ALTER TABLE dentists ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER license_number");
            console.log("Added 'phone' to dentists.");
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') {
                console.log("'phone' already exists in dentists.");
            } else {
                throw e;
            }
        }

        console.log("Migration completed.");
        process.exit(0);
    } catch (err) {
        console.error("Critical error during migration:", err);
        process.exit(1);
    }
}

fixSchema();
