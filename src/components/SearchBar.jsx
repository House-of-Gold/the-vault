import { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState("");

  function storeSearchValue(e) {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  }

  return (
    <div>
      <label>Search</label>
      <input type="text" value={searchValue} onChange={storeSearchValue} />
    </div>
  );
};

export default SearchBar;
