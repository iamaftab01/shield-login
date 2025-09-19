import { useState } from "react";
import styles from "../styles/Auth.module.css";
import Navbar from "../components/Navbar";
import API from "../services/api";

function Register() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsError(true);
      return;
    }

    try {
      const res = await API.post("/auth/register", {
        email,
        password,
      });
      setMessage(res.data.message || "Registration successful!");
      setIsError(false);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Registration failed");
      setIsError(true);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.card}>
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
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

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit">Register</button>
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

export default Register;
