import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import imageCompression from "browser-image-compression";
import Screen from "../components/Screen";
import { supabase } from "../lib/supabaseClient";

const categories = [
  "Rings",
  "Necklaces",
  "Earrings",
  "Bracelets",
  "Brooches",
  "Coins",
];
const expositors = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

const ItemForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item;
  const [name, setName] = useState(item?.name || "");
  const [code, setCode] = useState(item?.code?.replace("HOG-", "") || "");
  const [price, setPrice] = useState(item?.price || "");
  const [currency, setCurrency] = useState(item?.currency || "");
  const [acquiredAt, setAcquiredAt] = useState(
    item?.acquired_at || todayDate(),
  );
  const [notes, setNotes] = useState(item?.notes || "");
  const [expositor, setExpositor] = useState(item?.expositor || "");
  const [cost, setCost] = useState(item?.cost || "");
  const [category, setCategory] = useState(item?.category || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [actionError, setActionError] = useState(null);

  function storeName(e) {
    setName(e.target.value);
  }

  function storeCode(e) {
    setCode(e.target.value);
  }

  function storePrice(e) {
    setPrice(e.target.value);
  }

  function storeCurrency(e) {
    setCurrency(e.target.value);
  }

  function storeAcquiredAt(e) {
    setAcquiredAt(e.target.value);
  }

  function storeNotes(e) {
    setNotes(e.target.value);
  }

  function storeExpositor(e) {
    setExpositor(e.target.value);
  }

  function storeCost(e) {
    setCost(e.target.value);
  }

  function storeCategory(e) {
    setCategory(e.target.value);
  }

  async function storePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
    });
    setPhotoFile(compressedFile);
  }

  function validate() {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!code.trim()) {
      newErrors.code = "Code is required";
    } else {
      const digits = code.trim();
      if (digits.length !== 3 || isNaN(digits)) {
        newErrors.code = "Code must be 3 numbers";
      }
    }

    if (!price) {
      newErrors.price = "Price is required";
    } else if (isNaN(price) || Number(price) <= 0) {
      newErrors.price = "Price must be a number greater than 0";
    }

    if (!currency) {
      newErrors.currency = "Currency is required";
    }

    if (!expositor) {
      newErrors.expositor = "Expositor is required";
    }

    if (cost && (isNaN(cost) || Number(cost) < 0)) {
      newErrors.cost = "Cost must be a number";
    }

    if (!photoFile && !item?.photo_path) {
      newErrors.photo = "The photo is required";
    }

    return newErrors;
  }

  function validateWarnings() {
    const newWarnings = {};

    if (cost && price && Number(cost) > Number(price)) {
      newWarnings.costVsPrice = "Cost is higher than price";
    }

    return newWarnings;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    const newWarnings = validateWarnings();
    setErrors(newErrors);
    setWarnings(newWarnings);

    if (Object.keys(newErrors).length === 0) {
      let filePath = item?.photo_path;

      if (photoFile) {
        filePath = `${code}-${Date.now()}`;

        const { error: uploadError } = await supabase.storage
          .from("item-photos")
          .upload(filePath, photoFile);

        if (uploadError) {
          setActionError("Photo upload failed, please try again");
          return;
        }
      }

      const itemData = {
        code: `HOG-${code}`,
        name: name,
        price: Number(price),
        currency: currency,
        acquired_at: acquiredAt,
        notes: notes,
        expositor: Number(expositor),
        cost: cost ? Number(cost) : null,
        category: category,
        photo_path: filePath,
      };

      const { error } = item?.id
        ? await supabase.from("items").update(itemData).eq("id", item.id)
        : await supabase.from("items").insert(itemData);

      if (error) {
        if (error.code === "23505") {
          setActionError("This code is already in use");
        } else if (error.code === "23514") {
          setActionError("Please, select expositor 1-9");
        } else {
          setActionError("Network error");
        }
      } else if (item?.id) {
        navigate(`/item/${item.id}`);
      } else {
        navigate("/");
      }
    }
  }

  return (
    <Screen title={item?.id ? "Edit Item" : "Add Item"}>
      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input type="text" value={name} onChange={storeName} />
        {errors.name ? <p>{errors.name}</p> : null}

        <label>Code</label>
        <input type="text" value={code} onChange={storeCode} />
        {errors.code ? <p>{errors.code}</p> : null}

        <label>Price</label>
        <input type="number" value={price} onChange={storePrice} />
        {errors.price ? <p>{errors.price}</p> : null}

        <label>Currency</label>
        <select value={currency} onChange={storeCurrency}>
          <option value="">Choose the currency</option>
          <option value="Euro">Euro</option>
          <option value="Lek">Lek</option>
        </select>

        <label>Acquired</label>
        <input type="date" value={acquiredAt} onChange={storeAcquiredAt} />

        <label>Notes</label>
        <textarea value={notes} onChange={storeNotes} />

        <label>Expositor</label>
        <select value={expositor} onChange={storeExpositor}>
          <option value="">Select expositor</option>
          {expositors.map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
        {errors.expositor ? <p>{errors.expositor}</p> : null}

        <label>Cost</label>
        <input type="number" value={cost} onChange={storeCost} />
        {errors.cost ? <p>{errors.cost}</p> : null}
        {warnings.costVsPrice ? <p>{warnings.costVsPrice}</p> : null}

        <label>Category</label>
        <select value={category} onChange={storeCategory}>
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <label>Photo</label>
        <input type="file" accept="image/*" onChange={storePhoto} />
        {errors.photo ? <p>{errors.photo}</p> : null}

        <button type="submit">Save</button>

        {actionError ? <p>{actionError}</p> : null}
      </form>
    </Screen>
  );
};

export default ItemForm;
