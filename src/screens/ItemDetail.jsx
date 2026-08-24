import { useState } from "react";
import { useParams } from "react-router";
import Screen from "../components/Screen";
import useItems from "../hooks/useItems";
import { supabase } from "../lib/supabaseClient";

const ItemDetail = ({ role }) => {
  const { id } = useParams();
  const { items, isLoading, error, refetch } = useItems();
  const [confirmingSale, setConfirmingSale] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [soldPrice, setSoldPrice] = useState(null);

  const item = items.find((item) => item.id === id);

  const photoUrl = item?.photo_path
    ? supabase.storage.from("item-photos").getPublicUrl(item.photo_path).data
        .publicUrl
    : null;

  async function handleMarkSold() {
    const { error } = await supabase
      .from("items")
      .update({
        status: "sold",
        sold_at: new Date().toISOString(),
        sold_price: soldPrice,
      })
      .eq("id", item.id);

    if (error) {
      setActionError(error);
    } else {
      setConfirmingSale(false);
      refetch();
    }
  }

  async function handleUndoSale() {
    const { error } = await supabase
      .from("items")
      .update({
        status: "in_stock",
        sold_at: null,
        sold_price: null,
        sold_by: null,
      })
      .eq("id", item.id);

    if (error) {
      setActionError(error);
    } else {
      refetch();
    }
  }

  function getSoldPrice(e) {
    setSoldPrice(e.target.value);
  }

  return (
    <Screen title="Item">
      {isLoading ? <p>Loading...</p> : null}
      {error ? (
        <div>
          <p>{error.message}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      ) : null}
      {!isLoading && !error && !item ? <p>Item not found</p> : null}
      {!isLoading && !error && item ? (
        <div>
          {photoUrl ? <img src={photoUrl} alt={item.name} /> : null}
          <p>{item.name}</p>
          <p>{item.code}</p>
          <p>
            Price: {item.price} {item.currency}
          </p>
          {role === "admin" && confirmingSale ? (
            <div>
              <label>Sold Price</label>
              <input
                type="text"
                name="sold_price"
                defaultValue={item.price}
                onChange={getSoldPrice}
              />
            </div>
          ) : null}

          {item.status === "sold" && role === "admin" ? (
            <p>
              Sold-Price: {item.sold_price} {item.currency}
            </p>
          ) : null}

          {item.cost != null ? (
            <p>
              Cost: {item.cost} {item.currency}
            </p>
          ) : null}

          <p>Acquired: {item.acquired_at}</p>
          <p>Notes: {item.notes}</p>

          {actionError ? <p>{actionError.message}</p> : null}

          {item.status === "in_stock" ? (
            confirmingSale ? (
              <>
                <button onClick={handleMarkSold}>Confirm sold?</button>
                <button onClick={() => setConfirmingSale(false)}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setConfirmingSale(true)}>
                Mark as Sold
              </button>
            )
          ) : null}

          {item.status === "sold" ? (
            <button onClick={handleUndoSale}>Undo Sale</button>
          ) : null}

          {role === "admin" ? (
            <>
              <button>Edit</button>
              <button>Delete</button>
            </>
          ) : null}
        </div>
      ) : null}
    </Screen>
  );
};

export default ItemDetail;
