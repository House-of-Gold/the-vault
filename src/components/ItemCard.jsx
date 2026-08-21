import { Link } from "react-router";
import { supabase } from "../lib/supabaseClient";

const ItemCard = ({ item }) => {
  const photoUrl = item.photo_path
    ? supabase.storage.from("item-photos").getPublicUrl(item.photo_path).data
        .publicUrl
    : null;

  return (
    <Link className="item-card" to={`/item/${item.id}`}>
      {photoUrl ? <img src={photoUrl} alt={item.name} /> : null}
      <p>{item.name}</p>
      <p>{item.code}</p>
      <p>{item.price}</p>
      <p>{item.currency}</p>
    </Link>
  );
};

export default ItemCard;
