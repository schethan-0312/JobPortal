const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:root@localhost:5000/Nockree"
  });

  try {
    await client.connect();
    const res = await client.query("SELECT email, role FROM \"User\"");
    console.table(res.rows);
  } catch (err) {
    console.error("Error executing query", err.stack);
  } finally {
    await client.end();
  }
}

main();
