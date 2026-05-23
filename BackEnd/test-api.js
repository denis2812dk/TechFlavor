async function test() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@techflavor.test", password: "password123" }) 
  });
  const text = await loginRes.text();
  console.log("Login res:", text);
}
test();