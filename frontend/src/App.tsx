import { Link } from "react-router-dom";

function App() {
  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <p>
        <Link to="/login">Login</Link> |{" "}
        <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default App;
