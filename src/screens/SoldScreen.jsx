import { useState } from "react";
import Screen from "../components/Screen";
import SearchBar from "../components/SearchBar";
import ItemCard from "../components/ItemCard";
import useItems from "../hooks/useItems";

const SoldScreen = () => {
  const { items, isLoading, error, refetch } = useItems();
  const [filter, setFilter] = useState("");

  const sold = items.filter((item) => item.status === "sold");

  const filtered = sold.filter((item) => {
    const search = filter.toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search)
    );
  });

  //Order Items on the list by the last sold
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.sold_at) - new Date(a.sold_at),
  );

  return (
    <Screen title="Sold">
      <SearchBar onSearch={setFilter} />
      {isLoading ? <p>Loading...</p> : null}
      {error ? (
        <div>
          <p>{error.message}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      ) : null}
      {!isLoading && !error ? (
        <div>
          <p>{sorted.length} items sold</p>
          {sorted.length === 0 ? (
            <p>No items found</p>
          ) : (
            <div className="item-grid">
              {sorted.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </Screen>
  );
};

export default SoldScreen;
