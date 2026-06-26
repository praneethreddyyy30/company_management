import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  try {
    console.log("Logging in as intern@klassygo.com...");
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "intern@klassygo.com", password: "password123" })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    console.log("Logged in successfully! Token received:", loginData.token ? "YES" : "NO");
    
    console.log("Logging out...");
    const logoutRes = await fetch("http://localhost:5000/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${loginData.token}`
      }
    });
    
    if (!logoutRes.ok) {
      throw new Error(`Logout failed with status ${logoutRes.status}: ${await logoutRes.text()}`);
    }
    
    const logoutData = await logoutRes.json();
    console.log("Logout response received:", logoutData);
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

run();
