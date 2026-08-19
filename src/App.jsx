import { useState, useEffect } from "react";
import Login from "./screens/Login";
import { supabase } from "./lib/supabaseClient";
import StockScreen from "./screens/StockScreen";

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

  return (
    <>
      {!session ? (
        <Login />
      ) : (
        <>
          <StockScreen />
        </>
      )}
    </>
  );
};

export default App;
