import React, { useState, useEffect } from "react";
import Login from "./Login";
import { supabase } from "./lib/supabaseClient";

const App = () => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      },
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <>{!session ? <Login /> : <></>}</>;
};

export default App;
