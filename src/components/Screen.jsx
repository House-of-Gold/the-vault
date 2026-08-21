import { useState, useEffect } from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabaseClient";

const Screen = ({ title, children }) => {
  const [logoutError, setLogoutError] = useState(null);
  const [displayName, setDisplayName] = useState(null);

  useEffect(() => {
    async function fetchDisplayName() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", session.user.id)
          .single();

        if (!error) {
          setDisplayName(data.display_name);
        }
      }
    }
    fetchDisplayName();
  }, []);

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
      {displayName ? <span>{displayName}</span> : null}
      <button onClick={handleLogout}>Log out</button>
      {logoutError ? <p>{logoutError.message}</p> : null}
      {children}
    </div>
  );
};

export default Screen;
