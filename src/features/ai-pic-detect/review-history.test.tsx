import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReviewHistory } from './review-history';

describe('ReviewHistory', () => {
  it('asks a visitor to sign in before viewing saved reviews', () => {
    render(<ReviewHistory isAuthenticated={false} />);

    expect(
      screen.getByRole('heading', { name: '登录后查看检查记录' })
    ).toBeVisible();
    expect(screen.getByRole('link', { name: '登录或注册' })).toHaveAttribute(
      'href',
      '/sign-in?callbackUrl=/reviews'
    );
  });

  it('does not fabricate a review history for a signed-in creator', () => {
    render(<ReviewHistory isAuthenticated />);

    expect(screen.getByRole('heading', { name: '检查记录' })).toBeVisible();
    expect(screen.getByText('暂无已保存的检查记录。')).toBeVisible();
  });
});
