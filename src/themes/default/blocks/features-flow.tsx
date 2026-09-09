'use client';

import { motion } from 'framer-motion';

import { LazyImage } from '@/shared/blocks/common';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

const createFadeInVariant = (delay: number) => ({
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
  transition: {
    duration: 0.6,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

export function FeaturesFlow({ section }: { section: Section }) {
  if (!section.items || section.items.length === 0) {
    return null;
  }

  return (
    <section
      id={section.id || section.name}
      className={cn('py-16 md:py-24', section.className)}
    >
      <motion.div
        className="container mb-12 text-center"
        {...createFadeInVariant(0)}
      >
        {section.sr_only_title && (
          <h1 className="sr-only">{section.sr_only_title}</h1>
        )}
        <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-pretty md:max-w-5xl lg:text-4xl">
          {section.title}
        </h2>
        <p className="text-muted-foreground text-md mx-auto mb-4 max-w-full md:max-w-5xl">
          {section.description}
        </p>
      </motion.div>
      <div className="container flex flex-col items-center justify-center space-y-8 px-6 md:space-y-16">
        {section.items.map((item, index) => {
          const isImageRight = item.image_position === 'right';
          return (
            <motion.div
              key={index}
              className={cn(
                'grid items-center gap-6 py-16 sm:grid-cols-2 md:gap-12 lg:gap-24',
                isImageRight &&
                  'sm:[&>*:first-child]:order-2 sm:[&>*:last-child]:order-1'
              )}
              initial={{
                opacity: 0,
                y: 30,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1] as const,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.15 + 0.2,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
              >
                <LazyImage
                  src={item.image?.src ?? ''}
                  className="rounded-2xl"
                  alt={item.image?.alt ?? ''}
                />
              </motion.div>

              <motion.div
                className="relative space-y-4"
                initial={{ opacity: 0, x: isImageRight ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.15 + 0.3,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
              >
                <h3 className="text-xl font-medium md:text-2xl lg:text-2xl">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
