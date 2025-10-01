import React from "react";

function ScanResults({ results }) {
  // If results is undefined/null, use empty array
  const safeResults = results || [];

  if (safeResults.length === 0) {
    return (
      <div className="p-6 bg-gray-800 text-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Scan Results</h2>
        <p>No results yet. Upload a zip file to start scanning.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Scan Results</h2>
      <ul className="space-y-2">
        {safeResults.map((res, idx) => (
          <li
            key={idx}
            className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <p>
              <span className="font-semibold">File:</span> {res.file}
            </p>
            <p>
              <span className="font-semibold">Issue:</span> {res.issue}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ScanResults;
