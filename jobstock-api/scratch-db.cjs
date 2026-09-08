const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5000/jobstock' });

async function run() {
  await client.connect();
  
  const subs = await client.query(`SELECT id, "employerId", "packageId", status FROM "EmployerPackageSubscription" WHERE status = 'ACTIVE'`);
  console.log("ACTIVE SUBSCRIPTIONS:", subs.rows);
  
  const refundedOrders = await client.query(`SELECT id, status, "packageId", "userId" FROM "Order" WHERE status = 'REFUNDED'`);
  console.log("REFUNDED ORDERS:", refundedOrders.rows);

  const employers = await client.query(`SELECT id, "userId" FROM "Employer"`);
  
  for (const sub of subs.rows) {
      const employer = employers.rows.find(e => e.id === sub.employerId);
      if (employer) {
          const matchingOrder = refundedOrders.rows.find(o => o.packageId === sub.packageId && o.userId === employer.userId);
          if (matchingOrder) {
              console.log(`FOUND MISMATCH! Subscription ${sub.id} is ACTIVE but Order ${matchingOrder.id} is REFUNDED! FIXING IT...`);
              await client.query(`UPDATE "EmployerPackageSubscription" SET status = 'REFUNDED' WHERE id = $1`, [sub.id]);
          }
      }
  }
  
  await client.end();
}
run().catch(console.error);
