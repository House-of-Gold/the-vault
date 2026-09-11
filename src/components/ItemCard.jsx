import { Link } from "react-router";
import { supabase } from "../lib/supabaseClient";

const ItemCard = ({ item }) => {
  const photoUrl = item.photo_path
    ? supabase.storage.from("item-photos").getPublicUrl(item.photo_path).data
        .publicUrl
    : null;

  const isSold = item.status === "sold";

  return (
    <Link
      to={`/item/${item.id}`}
      className="group flex flex-col bg-bg border border-divider cursor-pointer transition-shadow duration-150 hover:shadow-md"
    >
      <div className="relative aspect-square bg-neutral-200 grid place-items-center overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            width="46"
            height="46"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-400"
          >
            <path d="M6 3h12l4 6-10 13L2 9Z" />
            <path d="M11 3 8 9l4 13 4-13-3-6" />
            <path d="M2 9h20" />
          </svg>
        )}
        <span
          className={`absolute top-2 left-2 text-xs px-2.5 py-0.5 rounded-md ${
            isSold
              ? "bg-neutral-100 text-neutral-800"
              : "bg-accent-100 text-accent-800"
          }`}
        >
          {isSold ? "Sold" : "In stock"}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-1">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-xs text-accent tabular-nums">
            {item.code}
          </span>
          <span className="text-xs uppercase tracking-wide text-text/55">
            {item.category}
          </span>
        </div>
        <p className="font-heading font-extrabold text-base leading-tight group-hover:text-accent">
          {item.name}
        </p>
        <p className="tabular-nums text-base mt-0.5">
          {item.price} {item.currency}
        </p>
      </div>
    </Link>
  );
};

export default ItemCard;
