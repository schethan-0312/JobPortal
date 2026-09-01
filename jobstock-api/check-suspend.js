fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'nammuhm370@gmail.com', password: 'password123' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
