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
      if (digits.length !== 4 || isNaN(digits)) {
        newErrors.code = "Code must be 4 numbers";
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

  const inputClass =
    "w-full min-h-9 px-2.5 py-1.5 text-sm text-text bg-surface border border-divider rounded-md caret-accent hover:border-text/45 focus-visible:border-accent focus-visible:outline-none";

  const photoPreviewUrl = photoFile
    ? URL.createObjectURL(photoFile)
    : item?.photo_path
      ? supabase.storage.from("item-photos").getPublicUrl(item.photo_path).data
          .publicUrl
      : null;

  return (
    <Screen title={item?.id ? "Edit Item" : "Add Item"}>
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-text/70">Name</label>
            <input
              type="text"
              value={name}
              onChange={storeName}
              className={inputClass}
            />
            {errors.name ? (
              <p className="text-accent-700 text-xs">{errors.name}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text/70">Code</label>
            <input
              type="text"
              value={code}
              onChange={storeCode}
              className={inputClass}
            />
            {errors.code ? (
              <p className="text-accent-700 text-xs">{errors.code}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text/70">Category</label>
            <select
              value={category}
              onChange={storeCategory}
              className={inputClass}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text/70">Price</label>
            <input
              type="number"
              value={price}
              onChange={storePrice}
              className={inputClass}
            />
            {errors.price ? (
              <p className="text-accent-700 text-xs">{errors.price}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text/70">Currency</label>
            <select
              value={currency}
              onChange={storeCurrency}
              className={inputClass}
            >
              <option value="">Choose the currency</option>
              <option value="Euro">Euro</option>
              <option value="Lek">Lek</option>
            </select>
            {errors.currency ? (
              <p className="text-accent-700 text-xs">{errors.currency}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text/70">Cost</label>
            <input
              type="number"
              value={cost}
              onChange={storeCost}
              className={inputClass}
            />
            {errors.cost ? (
              <p className="text-accent-700 text-xs">{errors.cost}</p>
            ) : null}
            {warnings.costVsPrice ? (
              <p className="text-accent-700 text-xs">{warnings.costVsPrice}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text/70">Acquired</label>
            <input
              type="date"
              value={acquiredAt}
              onChange={storeAcquiredAt}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text/70">Expositor</label>
            <select
              value={expositor}
              onChange={storeExpositor}
              className={inputClass}
            >
              <option value="">Select expositor</option>
              {expositors.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            {errors.expositor ? (
              <p className="text-accent-700 text-xs">{errors.expositor}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-text/70">Notes</label>
            <textarea
              value={notes}
              onChange={storeNotes}
              className={`${inputClass} min-h-20 resize-y`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs text-text/70">Photo</label>
          <div className="flex items-center gap-3">
            <div className="w-24 h-24 aspect-square bg-neutral-200 border border-divider grid place-items-center overflow-hidden flex-none">
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  width="32"
                  height="32"
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
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={storePhoto}
              className="text-sm"
            />
          </div>
          {errors.photo ? (
            <p className="text-accent-700 text-xs">{errors.photo}</p>
          ) : null}
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 font-heading font-extrabold text-sm rounded-md bg-accent text-bg px-3.5 py-2 hover:bg-accent-600 active:bg-accent-700"
        >
          Save
        </button>

        {actionError ? (
          <p className="text-accent-700 text-sm mt-3">{actionError}</p>
        ) : null}
      </form>
    </Screen>
  );
};

export default ItemForm;
