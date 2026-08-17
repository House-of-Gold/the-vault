import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const useItems = () => {
  const [loadedItems, setLoadedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchItems() {
    setIsLoading(true);
    const { data, error } = await supabase.from("items_view").select("*");

    if (error) {
      setError(error);
      setIsLoading(false);
    } else {
      setLoadedItems(data);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items: loadedItems,
    isLoading,
    error,
    refetch: fetchItems,
  };
};

export default useItems;
