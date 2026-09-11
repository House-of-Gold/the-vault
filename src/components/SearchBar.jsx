import { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState("");

  function storeSearchValue(e) {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  }

  return (
    <div className="flex flex-col gap-1 sm:max-w-xs">
      <label className="text-xs text-text/70">Search</label>
      <input
        type="text"
        value={searchValue}
        onChange={storeSearchValue}
        placeholder="Name or ID…"
        className="w-full min-h-9 px-2.5 py-1.5 text-sm text-text bg-surface border border-divider rounded-md caret-accent hover:border-text/45 focus-visible:border-accent focus-visible:outline-none"
      />
    </div>
  );
};

export default SearchBar;
