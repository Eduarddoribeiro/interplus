import { motion } from 'framer-motion'

export default function SectionTitle({
  title,
  description
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .4 }}
      className="mb-8"
    >
      <h2 className="font-display text-4xl uppercase leading-none text-neutral-900">
        {title}
      </h2>

      {description && (
        <p className="mt-3 text-neutral-500 max-w-xl">
          {description}
        </p>
      )}
    </motion.div>
  )
}