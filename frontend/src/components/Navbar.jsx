import { motion } from "framer-motion";
import { FaShieldAlt } from "react-icons/fa";

export default function Navbar() {
  return (
    <motion.nav 
      className="bg-gray-900 text-white p-4 shadow-lg flex items-center justify-between"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-2 text-xl font-bold">
        <FaShieldAlt className="text-green-400" />
        Cyber Scanner
      </div>
      <div className="flex gap-6 text-lg">
        <a href="/">Home</a>
        <a href="/history">History</a>
      </div>
    </motion.nav>
  );
}
