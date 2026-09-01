fetch('http://localhost:4000/api/auth/register-with-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@jobstock.com', password: 'password123', fullName: 'Test User', role: 'CANDIDATE', otp: 'ignored' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
