import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

function FileUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Scan completed successfully!");
      console.log("Scan Results:", res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload or scan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <label className="w-full cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-cyan-400 rounded-xl bg-gray-900/50 hover:bg-gray-800/70 transition">
        <span className="text-lg text-gray-300 mb-2">
          📂 Choose a ZIP file to scan
        </span>
        <input
          type="file"
          className="hidden"
          accept=".zip"
          onChange={handleFileChange}
        />
        {file && (
          <p className="mt-2 text-cyan-300 text-sm">{file.name}</p>
        )}
      </label>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleUpload}
        disabled={loading}
        className="mt-5 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "🔍 Scanning..." : "🚀 Start Scan"}
      </motion.button>
    </motion.div>
  );
}

export default FileUpload;
