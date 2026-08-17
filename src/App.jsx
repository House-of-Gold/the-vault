import React from "react";
import { supabase } from "./lib/supabaseClient";
import useItems from "./hooks/useItems";

const App = () => {
  const { items, isLoading, error } = useItems();

  if (isLoading) return <p>Items are loading...</p>;
  if (error) return <p>{error.message}</p>;
  return <pre>{JSON.stringify(items, null, 2)}</pre>;
};

export default App;
