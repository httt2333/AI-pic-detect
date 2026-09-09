'use client';

import { motion } from 'framer-motion';

import { LazyImage, SmartIcon } from '@/shared/blocks/common';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function FeaturesMedia({ section }: { section: Section }) {
  const imagePosition = section.image_position || 'left';
  const isImageRight = imagePosition === 'right';

  return (
    <section
      id={section.id || section.name}
      className={cn('py-16 md:py-24', section.className)}
    >
      <div className="container flex flex-col items-center justify-center space-y-8 px-6 md:space-y-16">
        <motion.div
          className={cn(
            'grid items-center gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24',
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
            ease: [0.22, 1, 0.36, 1] as const,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          >
            <LazyImage
              src={section.image?.src ?? ''}
              className="rounded-2xl"
              alt={section.image?.alt ?? ''}
            />
          </motion.div>

          <motion.div
            className="relative space-y-4"
            initial={{ opacity: 0, x: isImageRight ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          >
            <h2 className="text-xl font-medium md:text-lg lg:text-lg">
              {section.title}
            </h2>
            <p className="text-muted-foreground text-md">
              {section.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {section.items?.map((item) => (
                <div key={item.title}>
                  <h3 className="mb-2 flex items-center gap-2 text-sm">
                    <SmartIcon name={item.icon as string} size={16} />
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
