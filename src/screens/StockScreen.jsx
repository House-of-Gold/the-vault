import { useState } from "react";
import { Link } from "react-router";
import Screen from "../components/Screen";
import SearchBar from "../components/SearchBar";
import ItemCard from "../components/ItemCard";
import useItems from "../hooks/useItems";

const StockScreen = ({ role }) => {
  const { items, isLoading, error, refetch } = useItems();
  const [filter, setFilter] = useState("");

  const inStock = items.filter((item) => item.status === "in_stock");

  const filtered = inStock.filter((item) => {
    const search = filter.toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search)
    );
  });

  //Order Items on the list by the last acquired
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.acquired_at) - new Date(a.acquired_at),
  );

  return (
    <Screen title="Stock">
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
          <p>{sorted.length} items in stock</p>
          {role === "admin" ? <Link to="/add">Add Item</Link> : null}
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

export default StockScreen;
