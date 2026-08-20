import { useState } from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabaseClient";

const Screen = ({ title, children }) => {
  const [logoutError, setLogoutError] = useState(null);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    error ? setLogoutError(error) : null;
  }

  return (
    <div>
      <div className="logo">
        <p>The Vault</p>
        <p>House of Gold</p>
      </div>
      <h1>{title}</h1>
      <nav>
        <Link to="/">Stock</Link>
        <Link to="/sold">Sold</Link>
      </nav>
      <button onClick={handleLogout}>Log out</button>
      {logoutError ? <p>{logoutError.message}</p> : null}
      {children}
    </div>
  );
};

export default Screen;
