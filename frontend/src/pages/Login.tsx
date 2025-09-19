import { useState } from "react";
import Navbar from "../components/Navbar";
import styles from "../styles/Auth.module.css";
import API from "../services/api";

function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });
      setMessage(res.data.message || "Login successful!");
      setIsError(false);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Login failed");
      setIsError(true);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.card}>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>

        {message && (
          <p className={`${styles.message} ${isError ? styles.error : styles.success}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
