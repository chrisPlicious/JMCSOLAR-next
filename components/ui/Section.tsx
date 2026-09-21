import { type ElementType, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

const containerSizes = {
  wide: 'max-w-7xl',
  narrow: 'max-w-5xl',
  prose: 'max-w-3xl',
} as const;

export type ContainerSize = keyof typeof containerSizes;

interface ContainerProps {
  size?: ContainerSize;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

/** The one horizontal frame: centred, with the site gutter (16 / 24 / 32px). */
export function Container({ size = 'wide', as: Component = 'div', className, children }: ContainerProps) {
  return (
    <Component className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', containerSizes[size], className)}>
      {children}
    </Component>
  );
}

const tones = {
  white: 'bg-white',
  tint: 'bg-navy-50',
  dark: 'surface-dark bg-navy-950',
} as const;

const spacings = {
  default: 'py-16 sm:py-20 lg:py-24',
  compact: 'py-10 sm:py-14',
  none: '',
} as const;

interface SectionProps {
  /** white → tint → dark; alternate so neighbouring sections read as bands. */
  tone?: keyof typeof tones;
  spacing?: keyof typeof spacings;
  /** Wraps children in a Container of this size; `false` to lay out yourself. */
  container?: ContainerSize | false;
  as?: ElementType;
  id?: string;
  className?: string;
  containerClassName?: string;
  children?: ReactNode;
  'aria-labelledby'?: string;
}

export function Section({
  tone = 'white',
  spacing = 'default',
  container = 'wide',
  as: Component = 'section',
  id,
  className,
  containerClassName,
  children,
  ...rest
}: SectionProps) {
  return (
    <Component id={id} className={cn('relative', tones[tone], spacings[spacing], className)} {...rest}>
      {container ? (
        <Container size={container} className={containerClassName}>
          {children}
        </Container>
      ) : (
        children
      )}
    </Component>
  );
}

export default Section;
