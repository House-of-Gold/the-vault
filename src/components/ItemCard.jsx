import { supabase } from "../lib/supabaseClient";

const ItemCard = ({ item }) => {
  const photoUrl = item.photo_path
    ? supabase.storage.from("item-photos").getPublicUrl(item.photo_path).data
        .publicUrl
    : null;

  return (
    <div className="item-card">
      {photoUrl ? <img src={photoUrl} alt={item.name} /> : null}
      <p>{item.name}</p>
      <p>{item.code}</p>
      <p>{item.price}</p>
      <p>{item.currency}</p>
    </div>
  );
};

export default ItemCard;
