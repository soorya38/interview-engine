
import { Client } from 'pg';

async function main() {
    const client = new Client({
        connectionString: "postgresql://sooryaakilesh@localhost:5432/postgres"
    });

    try {
        await client.connect();
        console.log("Connected to postgres DB.");

        const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
        const dbs = res.rows.map(r => r.datname);
        console.log("Databases found:", dbs);

        await client.end();

        for (const dbName of dbs) {
            if (dbName === 'postgres') continue;

            console.log(`\nChecking database: ${dbName}...`);
            const dbClient = new Client({
                connectionString: `postgresql://sooryaakilesh@localhost:5432/${dbName}`
            });

            try {
                await dbClient.connect();
                // Check if interview_sessions table exists and has data
                const tableRes = await dbClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'interview_sessions'
          );
        `);

                if (tableRes.rows[0].exists) {
                    const countRes = await dbClient.query('SELECT COUNT(*) FROM interview_sessions');
                    console.log(` - interview_sessions table found. Row count: ${countRes.rows[0].count}`);
                } else {
                    console.log(" - interview_sessions table NOT found.");
                }
                await dbClient.end();
            } catch (err: any) {
                console.log(` - Could not connect or query: ${err.message}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

main();
