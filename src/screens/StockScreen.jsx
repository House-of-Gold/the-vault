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
      <div className="mb-6">
        <SearchBar onSearch={setFilter} />
      </div>

      {isLoading ? <p className="text-text/55 text-sm">Loading...</p> : null}

      {error ? (
        <div className="flex items-center gap-3">
          <p className="text-accent-700 text-sm">{error.message}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md border border-divider px-3.5 py-2 cursor-pointer hover:bg-text/7 active:bg-text/14"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-text/55 text-sm">
              {sorted.length} items in stock
            </p>
            {role === "admin" ? (
              <Link
                to="/add"
                className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md bg-accent text-bg px-3.5 py-2 hover:bg-accent-600 active:bg-accent-700"
              >
                Add Item
              </Link>
            ) : null}
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-heading font-extrabold text-xl">
                No items match
              </p>
              <p className="text-text/55 text-sm mt-1.5">
                Try a different search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,216px)] justify-start gap-0">
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
