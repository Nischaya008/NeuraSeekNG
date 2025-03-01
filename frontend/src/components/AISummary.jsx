import { motion } from 'framer-motion';
import { FiCpu, FiCheckCircle } from 'react-icons/fi';

const AISummary = ({ summary, sources }) => {
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800"
    >
      <div className="flex items-center gap-2 mb-2">
        <FiCpu className="text-purple-500" />
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
          AI Summary
        </span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
        {summary}
      </p>
      {sources && sources.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <FiCheckCircle className="text-green-500" />
          <span>Sources: {sources.join(', ')}</span>
        </div>
      )}
    </motion.div>
  );
};

export default AISummary; 