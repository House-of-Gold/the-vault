import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import Screen from "../components/Screen";
import useItems from "../hooks/useItems";
import { supabase } from "../lib/supabaseClient";

const ItemDetail = ({ role }) => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  async function handleDelete() {
    const { error } = await supabase
      .from("items")
      .update({ status: "deleted" })
      .eq("id", item.id);

    if (error) {
      setActionError(error);
    } else {
      navigate("/");
    }
  }

  function getSoldPrice(e) {
    setSoldPrice(e.target.value);
  }

  return (
    <Screen title={item ? item.name : "Item"}>
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

      {!isLoading && !error && !item ? (
        <p className="text-text/55 text-sm">Item not found</p>
      ) : null}

      {!isLoading && !error && item ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="aspect-square bg-neutral-200 border border-divider grid place-items-center overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                width="90"
                height="90"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-400"
              >
                <path d="M6 3h12l4 6-10 13L2 9Z" />
                <path d="M11 3 8 9l4 13 4-13-3-6" />
                <path d="M2 9h20" />
              </svg>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md border border-accent text-accent">
                {item.category}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-md ${
                  item.status === "sold"
                    ? "bg-neutral-100 text-neutral-800"
                    : "bg-accent-100 text-accent-800"
                }`}
              >
                {item.status === "sold" ? "Sold" : "In stock"}
              </span>
              <span className="text-xs text-text/55 tabular-nums ml-auto">
                {item.code}
              </span>
            </div>

            <p className="font-heading font-extrabold text-2xl leading-tight mb-3">
              {item.price} {item.currency}
            </p>

            <hr className="border-t-2 border-divider mb-4" />

            <div className="grid grid-cols-2 gap-px mb-4">
              <div className="border border-divider p-3">
                <div className="text-xs uppercase tracking-wide text-text/55">
                  Acquired
                </div>
                <div className="text-sm mt-0.5">
                  {new Date(item.acquired_at).toLocaleString("en-GB")}
                </div>
              </div>

              {item.cost != null ? ( // Supabase never disclouses Cost to non-admin role
                <div className="border border-divider p-3">
                  <div className="text-xs uppercase tracking-wide text-text/55">
                    Cost
                  </div>
                  <div className="text-sm mt-0.5">
                    {item.cost} {item.currency}
                  </div>
                </div>
              ) : null}

              {item.status === "sold" ? (
                <div className="border border-divider p-3">
                  <div className="text-xs uppercase tracking-wide text-text/55">
                    Sold price
                  </div>
                  <div className="text-sm mt-0.5">
                    {item.sold_price} {item.currency}
                  </div>
                </div>
              ) : null}

              {item.status === "sold" ? (
                <div className="border border-divider p-3">
                  <div className="text-xs uppercase tracking-wide text-text/55">
                    Sold on
                  </div>
                  <div className="text-sm mt-0.5">
                    {new Date(item.sold_at).toLocaleString("en-GB")}
                  </div>
                </div>
              ) : null}

              {role === "admin" && item.status === "sold" ? (
                <div className="border border-divider p-3">
                  <div className="text-xs uppercase tracking-wide text-text/55">
                    Sold by
                  </div>
                  <div className="text-sm mt-0.5">{item.sold_by}</div>
                </div>
              ) : null}

              <div className="border border-divider p-3">
                <div className="text-xs uppercase tracking-wide text-text/55">
                  Expositor
                </div>
                <div className="text-sm mt-0.5">{item.expositor}</div>
              </div>
            </div>

            {item.notes ? (
              <div className="mb-4">
                <div className="text-xs uppercase tracking-wide text-text/55 mb-1">
                  Notes
                </div>
                <p className="text-sm">{item.notes}</p>
              </div>
            ) : null}

            {confirmingSale ? (
              <div className="flex flex-col gap-1 mb-4 p-3 border border-divider bg-surface">
                <label className="text-xs text-text/70">Sold Price</label>
                <input
                  type="text"
                  name="sold_price"
                  defaultValue={item.price}
                  onChange={getSoldPrice}
                  className="w-full min-h-9 px-2.5 py-1.5 text-sm text-text bg-bg border border-divider rounded-md caret-accent hover:border-text/45 focus-visible:border-accent focus-visible:outline-none"
                />
              </div>
            ) : null}

            {actionError ? (
              <p className="text-accent-700 text-sm mb-3">
                {actionError.message}
              </p>
            ) : null}
            {/* What error message are we requesting here */}

            <div className="flex flex-wrap gap-2">
              {item.status === "in_stock" ? (
                confirmingSale ? (
                  <>
                    <button
                      onClick={handleMarkSold}
                      className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md bg-accent text-bg px-3.5 py-2 hover:bg-accent-600 active:bg-accent-700"
                    >
                      Confirm sold?
                    </button>
                    <button
                      onClick={() => setConfirmingSale(false)}
                      className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md border border-divider px-3.5 py-2 cursor-pointer hover:bg-text/7 active:bg-text/14"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmingSale(true)}
                    className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md bg-accent text-bg px-3.5 py-2 hover:bg-accent-600 active:bg-accent-700"
                  >
                    Mark as Sold
                  </button>
                )
              ) : null}

              {item.status === "sold" ? (
                <button
                  onClick={handleUndoSale}
                  className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md border border-divider px-3.5 py-2 cursor-pointer hover:bg-text/7 active:bg-text/14"
                >
                  Undo Sale
                </button>
              ) : null}

              {role === "admin" ? (
                <>
                  <button
                    onClick={() =>
                      navigate(`/edit/${item.id}`, { state: { item } })
                    }
                    className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md border border-divider px-3.5 py-2 cursor-pointer hover:bg-text/7 active:bg-text/14"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md border border-divider text-accent px-3.5 py-2 cursor-pointer hover:bg-text/7 active:bg-text/14"
                  >
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  );
};

export default ItemDetail;
