import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

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
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    error ? setLocalError(error) : null;
  }

  const inputClass =
    "w-full min-h-9 px-2.5 py-1.5 text-sm text-text bg-surface border border-divider rounded-md caret-accent hover:border-text/45 focus-visible:border-accent focus-visible:outline-none";

  return (
    <div className="min-h-screen grid place-items-center bg-bg text-text p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <path d="M6 3h12l4 6-10 13L2 9Z" />
            <path d="M11 3 8 9l4 13 4-13-3-6" />
            <path d="M2 9h20" />
          </svg>
          <div>
            <div className="font-heading font-extrabold text-2xl uppercase tracking-wide">
              The Vault
            </div>
            <div className="text-text/55 text-xs uppercase tracking-widest">
              House of Gold
            </div>
          </div>
        </div>

        <hr className="border-t-2 border-divider mb-4" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={storeEmail}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text/70">Password</label>
            <input
              type="password"
              value={password}
              onChange={storePassword}
              className={inputClass}
            />
          </div>

          {localError ? (
            <p className="text-accent-700 text-sm">{localError.message}</p>
          ) : null}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md bg-accent text-bg px-3.5 py-2 hover:bg-accent-600 active:bg-accent-700"
          >
            Log-in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
