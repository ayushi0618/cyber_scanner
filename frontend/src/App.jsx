import React from "react";
import FileUpload from "./components/FileUpload";
import Dashboard from "./components/Dashboard";
import ScanResults from "./components/ScanResults";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center p-6">
      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* Title */}
      <h1 className="text-4xl font-bold mb-8 text-cyan-400 drop-shadow-lg animate-pulse">
        🚀 Cyber Scanner
      </h1>

      {/* Upload Section */}
      <div className="w-full max-w-2xl bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-700">
        <FileUpload />
      </div>

      {/* Dashboard & Results */}
      <div className="w-full max-w-5xl mt-10 grid md:grid-cols-2 gap-6">
        <Dashboard />
        <ScanResults />
      </div>
    </div>
  );
}

export default App;



