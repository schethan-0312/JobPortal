const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:root@localhost:5000/jobstock"
  });

  try {
    await client.connect();
    
    // Check if it already exists
    const check = await client.query("SELECT * FROM \"User\" WHERE email = 'admin@jobstock.com'");
    if (check.rows.length === 0) {
      await client.query(`
        INSERT INTO "User" (
          id, email, "passwordHash", role, "adminRole", "isEmailVerified", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          'admin@jobstock.com',
          '$2b$12$MQTVsInoRmq4p0ctuMcVD.57QFxldczKDRp00.vNr2tIaRMSSvhDy',
          'ADMIN',
          'SUPER_ADMIN',
          true,
          NOW()
        )
      `);
      console.log("Admin created via SQL.");
    } else {
      console.log("Admin already exists.");
    }
  } catch (err) {
    console.error("Error executing query", err.stack);
  } finally {
    await client.end();
  }
}

main();
