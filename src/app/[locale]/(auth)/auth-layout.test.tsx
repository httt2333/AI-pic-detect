import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AuthLayout from './layout';

vi.mock('@/shared/blocks/common', () => ({
  LocaleSelector: () => <button type="button">切换语言</button>,
  ThemeToggler: () => <button type="button">切换主题</button>,
}));

vi.mock('@/core/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AuthLayout', () => {
  it('keeps the product navigation fixed and offers a clear route home', () => {
    render(
      <AuthLayout>
        <div>登录表单</div>
      </AuthLayout>
    );

    expect(screen.getByRole('banner')).toHaveClass('fixed');
    expect(screen.getByRole('link', { name: '返回图片检查' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByText('登录表单')).toBeVisible();
  });
});
