import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);

  function storeEmail(e) {
    setEmail(e.target.value);
  }

  function storePassword(e) {
    setPassword(e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    error ? setLocalError(error) : null;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Email</label>
      <input type="email" value={email} onChange={storeEmail} />
      {localError ? <p>{localError.message}</p> : null}
      <label>Password</label>
      <input type="password" value={password} onChange={storePassword} />
      {localError ? <p>{localError.message}</p> : null}
      <button type="submit">Log-in</button>
    </form>
  );
};

export default Login;
