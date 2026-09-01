const testLogin = async (email, password) => {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  console.log(email, res.status, data.accessToken ? 'Success' : data.message);
};

Promise.all([
  testLogin('admin@gmail.com', 'Admin@123'),
  testLogin('nammuhm370@gmail.com', 'Yogitha@123')
]);
