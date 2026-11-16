import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const useDiscount = () => {
  const [discountPercent, setDiscountPercent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchDiscount() {
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "seller_max_discount_percent")
      .single();

    if (error) {
      setError(error);
      setIsLoading(false);
    } else {
      setDiscountPercent(Number(data.value));
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDiscount();
  }, []);

  return {
    discountPercent,
    isLoading,
    error,
    refetch: fetchDiscount,
  };
};

export default useDiscount;
