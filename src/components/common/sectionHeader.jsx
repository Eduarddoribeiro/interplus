import { motion } from 'framer-motion'

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  light = false
}) {
  const isCenter = align === 'center'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className={`
        ${isCenter ? 'text-center mx-auto' : ''}
        mb-12
      `}
    >
      {eyebrow && (
        <p
          className={`
            text-[11px]
            font-bold
            uppercase
            tracking-[.16em]
            mb-3
            ${
              light
                ? 'text-white/70'
                : 'text-inter-red'
            }
          `}
        >
          {eyebrow}
        </p>
      )}

      <h2
        className={`
          font-display
          text-5xl
          md:text-6xl
          uppercase
          leading-[.9]
          ${
            light
              ? 'text-white'
              : 'text-neutral-900'
          }
        `}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`
            mt-5
            max-w-2xl
            leading-8
            ${
              light
                ? 'text-white/75'
                : 'text-neutral-500'
            }
            ${isCenter ? 'mx-auto' : ''}
          `}
        >
          {description}
        </p>
      )}
    </motion.div>
  )
}

