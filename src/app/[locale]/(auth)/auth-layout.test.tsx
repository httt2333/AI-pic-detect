import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AuthLayout from './layout';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AuthLayout', () => {
  it('keeps the product navigation fixed across auth pages', () => {
    render(
      <AuthLayout>
        <div>登录表单</div>
      </AuthLayout>
    );

    expect(screen.getByRole('banner')).toHaveClass('fixed');
    expect(screen.getByRole('link', { name: '怎么检查' })).toHaveAttribute(
      'href',
      '/zh#how-it-works'
    );
    expect(screen.getByRole('link', { name: '检查记录' })).toHaveAttribute(
      'href',
      '/reviews'
    );
    expect(screen.getByText('登录表单')).toBeVisible();
  });
});
