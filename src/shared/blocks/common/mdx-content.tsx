import { getMDXComponents } from '@/mdx-components';
import type { MDXComponents } from 'mdx/types';
import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

interface MDXContentProps {
  source: string;
  components?: MDXComponents;
}

/**
 * Render MDX content from a string source (e.g., from database)
 * This component uses next-mdx-remote to compile and render MDX at runtime
 */
export async function MDXContent({ source, components }: MDXContentProps) {
  const mdxComponents = getMDXComponents(components);

  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      }}
    />
  );
}
