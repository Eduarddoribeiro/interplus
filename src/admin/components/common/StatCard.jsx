import { motion } from 'framer-motion'

export default function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color = 'text-inter-red'
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: .2 }}
      className="
        rounded-3xl
        border
        border-neutral-200
        bg-white
        p-7
        shadow-sm
        hover:shadow-xl
        transition-all
      "
    >
      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-neutral-500">
            {title}
          </p>

          <h2 className="mt-2 text-5xl font-display uppercase leading-none text-neutral-900">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-4 text-sm text-neutral-400">
              {subtitle}
            </p>
          )}

        </div>

        {Icon && (
          <div
            className="
              w-14
              h-14
              rounded-2xl
              bg-inter-red/10
              flex
              items-center
              justify-center
            "
          >
            <Icon
              size={26}
              className={color}
            />
          </div>
        )}

      </div>
    </motion.div>
  )
}