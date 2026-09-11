import { useState, useEffect } from "react";
import { NavLink } from "react-router";
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

  const tabClass = ({ isActive }) =>
    `text-sm pb-0.5 border-b-2 ${
      isActive
        ? "text-accent border-accent font-semibold"
        : "text-text border-transparent"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <nav className="flex items-start sm:items-center justify-between gap-4 sticky top-0 z-20 bg-bg border-b-2 border-divider px-4 py-3">
        {/* Brand block: icon + a text stack. The stack is a column on mobile (Vault over House of Gold, both left-aligned) and unstacks into one line at sm+. */}
        <div className="flex items-center gap-2">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent shrink-0"
          >
            <path d="M6 3h12l4 6-10 13L2 9Z" />
            <path d="M11 3 8 9l4 13 4-13-3-6" />
            <path d="M2 9h20" />
          </svg>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <span className="font-heading font-extrabold text-lg uppercase tracking-wide">
              The Vault
            </span>
            <span className="text-text/55 text-sm uppercase tracking-widest">
              House of Gold
            </span>
          </div>
        </div>

        {/* Controls block: tabs stacked over name+logout, both left-aligned so Stock lines up with the display name. Same unstack-at-sm+ approach. */}
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex gap-3 sm:gap-4">
            <NavLink to="/" className={tabClass}>
              Stock
            </NavLink>
            <NavLink to="/sold" className={tabClass}>
              Sold
            </NavLink>
          </div>

          <div className="flex items-center gap-3 sm:pl-3 sm:border-l-2 sm:border-divider">
            {displayName ? (
              <span className="text-sm font-semibold">{displayName}</span>
            ) : null}
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md border border-divider px-3.5 py-2 cursor-pointer hover:bg-text/7 active:bg-text/14"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {logoutError ? (
        <p className="text-accent-700 text-sm px-4 pt-2">
          {logoutError.message}
        </p>
      ) : null}

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-8 pb-16">
        <h1 className="font-heading font-extrabold text-4xl tracking-tight leading-tight mb-4">
          {title}
        </h1>
        <hr className="border-t-2 border-divider mb-6" />
        {children}
      </main>
    </div>
  );
};

export default Screen;
