import { motion } from 'framer-motion';
import { FiGithub, FiLinkedin } from 'react-icons/fi';
import { RiTwitterXFill } from 'react-icons/ri';

const SocialLinks = () => {
  const links = [
    {
      icon: FiGithub,
      url: "https://github.com/Nischaya008",
      label: "GitHub",
      color: "hover:text-[#6e5494]",
      hoverBg: "hover:bg-[#6e5494]/10"
    },
    {
      icon: FiLinkedin,
      url: "https://www.linkedin.com/in/nischaya008/",
      label: "LinkedIn",
      color: "hover:text-[#0077b5]",
      hoverBg: "hover:bg-[#0077b5]/10"
    },
    {
      icon: RiTwitterXFill,
      url: "https://x.com/Nischaya008",
      label: "Twitter",
      color: "hover:text-[#000000]",
      hoverBg: "hover:bg-[#000000]/10"
    }
  ];

  const container = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="flex gap-3">
        {links.map((link, index) => (
          <motion.div key={link.label} className="relative" variants={item}>
            <motion.a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3 glass-panel rounded-full ${link.color} ${link.hoverBg}
                      transition-all duration-300 group relative block`}
              whileHover={{ 
                scale: 1.15,
                rotate: 360,
                transition: { type: "spring", stiffness: 300 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-retro-rose/20 to-retro-terminal/20 
                         rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              <link.icon className="w-5 h-5 relative z-10" />
            </motion.a>
            <motion.div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                       bg-retro-background/90 px-2 py-1 rounded text-xs whitespace-nowrap
                       opacity-0 group-hover:opacity-100 pointer-events-none"
              initial={{ y: 10, opacity: 0 }}
              whileHover={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {link.label}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SocialLinks; 