import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/history");
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold mb-4 text-purple-700">Scan History</h2>

      {history.length === 0 ? (
        <p>No scans yet.</p>
      ) : (
        <ul className="space-y-3">
          {history.map((item) => (
            <li
              key={item.id}
              className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition"
            >
              <p>
                <span className="font-semibold">ID:</span> {item.id}
              </p>
              <p>
                <span className="font-semibold">Timestamp:</span> {item.timestamp}
              </p>
              <p>
                <span className="font-semibold">Scanned Files:</span>{" "}
                {item.results_count}
              </p>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
