import autocannon from 'autocannon';

async function runTest(connections, duration) {
  console.log(`\nTesting with ${connections} concurrent connections...`);
  return new Promise((resolve) => {
    const instance = autocannon({
      url: 'http://localhost:4000/api/jobs/public',
      connections: connections,
      duration: duration,
      pipelining: 1,
    }, (err, result) => {
      if (err) {
        console.error("Error running test:", err);
        return resolve(null);
      }
      resolve(result);
    });
    
    autocannon.track(instance, {renderProgressBar: false});
  });
}

async function main() {
  const connectionSteps = [10, 100, 500, 1000, 5000];
  const duration = 10; // seconds per step

  for (const conns of connectionSteps) {
    const res = await runTest(conns, duration);
    if (!res) break;

    const errors = res.errors;
    const timeouts = res.timeouts;
    const non2xx = res.non2xx;
    const reqPerSec = res.requests.average;
    const latency = res.latency.average;

    console.log(`Results for ${conns} connections:`);
    console.log(`- Requests/sec: ${reqPerSec}`);
    console.log(`- Avg Latency: ${latency} ms`);
    console.log(`- Errors: ${errors}, Timeouts: ${timeouts}, Non-2xx Responses: ${non2xx}`);

    if (errors > 0 || timeouts > (res.requests.total * 0.1)) {
      console.log(`\n⚠️ The server started failing significantly at ${conns} concurrent connections.`);
      console.log(`Breaking point reached!`);
      break;
    }
  }
  console.log("\nLoad testing completed.");
}

main().catch(console.error);
