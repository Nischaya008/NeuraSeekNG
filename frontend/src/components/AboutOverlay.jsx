import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const AboutOverlay = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9, 
              y: 40,
              transition: { duration: 0.2 }
            }}
            className="w-full max-w-2xl mx-4 p-8 glass-panel rounded-2xl z-[101] relative"
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full 
                       hover:bg-retro-rose/10 transition-colors duration-200"
            >
              <FiX className="w-5 h-5 text-retro-paper" />
            </motion.button>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent 
                             bg-gradient-to-r from-retro-rose to-retro-yellow">
                  About NeuraSeekNG
                </h2>
                <p className="mt-4 text-retro-paper/80 leading-relaxed">
                NeuraSeekNG is an AI-powered search engine that enhances your search experience with intelligent summaries, sentiment analysis, and source credibility checks. It integrates multiple platforms, including Google Search, YouTube, Reddit, and Google Scholar, to deliver accurate, real-time insights.
                <br></br>With a retro-inspired UI and smooth animations, NeuraSeekNG offers an intuitive, multi-platform search experience. Optimized for speed and efficiency, it features AI-driven insights, interactive filtering, and smart caching for seamless browsing. Whether for research or exploration, NeuraSeekNG makes searching smarter.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent 
                             bg-gradient-to-r from-retro-rose to-retro-yellow">
                  About Me
                </h2>
                <p className="mt-4 text-retro-paper/80 leading-relaxed">
                I am a Computer Science Engineering student specializing in AI & Machine Learning (Hons. IBM) with a strong foundation in Data Structures & Algorithms (C++). My expertise lies in AI-driven search systems, intelligent data processing, and scalable software architecture.

                <br></br>Passionate about cutting-edge AI applications, I focus on building high-performance platforms like NeuraSeekNG, integrating NLP, real-time analytics, and intelligent search algorithms. With a strategic mindset and problem-solving skills, I aim to drive innovation in AI-powered search and information retrieval.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AboutOverlay; 