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
        rounded-xl
        border
        border-line
        bg-white
        p-7
       
        hover:shadow-xl
        transition-all
      "
    >
      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-muted">
            {title}
          </p>

          <h2 className="mt-2 text-5xl font-display uppercase leading-none text-ink">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-4 text-sm text-muted">
              {subtitle}
            </p>
          )}

        </div>

        {Icon && (
          <div
            className="
              w-14
              h-14
              rounded-xl
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