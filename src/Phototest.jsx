import { useState } from "react";
import imageCompression from "browser-image-compression";

const Phototest = () => {
  const [file, setFile] = useState(null);

  async function handleChange(e) {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    const selected = e.target.files[0];
    const compressed = await imageCompression(selected, options);
    setFile(compressed);
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleChange} />
      {file && (
        <p>
          {file.name} - {file.size / 1024 / 1024} - {file.type}
        </p>
      )}
    </div>
  );
};

export default Phototest;
