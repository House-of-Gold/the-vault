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
      <div className="mb-6">
        <SearchBar onSearch={setFilter} />
      </div>

      {isLoading ? <p className="text-text/55 text-sm">Loading...</p> : null}

      {error ? (
        <div className="flex items-center gap-3">
          <p className="text-accent-700 text-sm">{error.message}</p>
          <button onClick={refetch} className={buttonVariants.primary}>
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div>
          <p className="text-text/55 text-sm mb-4">
            {sorted.length} items sold
          </p>

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

export default SoldScreen;
