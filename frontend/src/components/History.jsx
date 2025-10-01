import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function History() {
  const [history, setHistory] = useState([]);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/history");
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load history!");
    }
  };

  const fetchDetails = async (runId) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/history/${runId}`);
      setDetails(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load run details!");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.h2 
        className="text-2xl font-bold mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Scan History
      </motion.h2>

      {/* History Table */}
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3">Run ID</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Type</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <motion.tr 
                key={item.id} 
                className="border-b hover:bg-gray-100 cursor-pointer"
                whileHover={{ scale: 1.01 }}
              >
                <td className="p-3">{item.id}</td>
                <td className="p-3">{new Date(item.timestamp).toLocaleString()}</td>
                <td className="p-3">{item.type}</td>
                <td className="p-3">
                  <button 
                    onClick={() => fetchDetails(item.id)} 
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Run Details */}
      {details && (
        <motion.div 
          className="mt-6 p-6 bg-gray-100 rounded-xl shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-xl font-bold mb-3">Details for Run {details.id}</h3>
          <ul className="space-y-2">
            {details.results.map((item, index) => (
              <li key={index} className="p-3 bg-white rounded shadow">
                <strong>{item.file}:{item.line}</strong> - {item.vulnerability}
                <p className="text-sm">Severity: {item.severity}</p>
                <p className="text-sm">💡 {item.remediation}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
