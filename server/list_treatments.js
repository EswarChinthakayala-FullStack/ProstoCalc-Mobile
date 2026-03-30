const db = require('./db');

async function listTreatments() {
    try {
        const [rows] = await db.query('SELECT name, default_cost FROM treatment_catalog LIMIT 50');
        console.log("--- TREATMENT CATALOG ---");
        rows.forEach(r => console.log(`- ${r.name}: ₹${r.default_cost}`));
        console.log("-------------------------");
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

listTreatments();
