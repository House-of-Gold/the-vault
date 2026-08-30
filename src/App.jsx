import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Login from "./screens/Login";
import { supabase } from "./lib/supabaseClient";
import StockScreen from "./screens/StockScreen";
import SoldScreen from "./screens/SoldScreen";
import ItemDetail from "./screens/ItemDetail";
import AddItem from "./screens/AddItem";

const App = () => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);

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

  useEffect(() => {
    async function fetchRole() {
      if (session) {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error) {
          setRole(null);
        } else {
          setRole(data.role);
        }
      } else {
        setRole(null);
      }
    }
    fetchRole();
  }, [session]);

  return (
    <>
      {!session ? (
        <Login />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StockScreen role={role} />} />
            <Route path="/sold" element={<SoldScreen />} />
            <Route path="/item/:id" element={<ItemDetail role={role} />} />
            <Route path="/add" element={<AddItem />} />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
};

export default App;
