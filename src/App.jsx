import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Login from "./screens/Login";
import { supabase } from "./lib/supabaseClient";
import StockScreen from "./screens/StockScreen";
import SoldScreen from "./screens/SoldScreen";

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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StockScreen />} />
            <Route path="/sold" element={<SoldScreen />} />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
};

export default App;
