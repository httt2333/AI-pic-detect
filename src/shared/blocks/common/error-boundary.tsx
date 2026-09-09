'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { envConfigs } from '@/config';
import { Button } from '@/shared/components/ui/button';

import { SmartIcon } from './smart-icon';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: any): State {
    // Ignore NEXT_NOT_FOUND error to let Next.js handle 404
    if (error.digest === 'NEXT_NOT_FOUND') {
      return { hasError: false };
    }
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    console.log('ErrorBoundary render', this.state);
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <Image
            src={envConfigs.app_logo}
            alt={envConfigs.app_name}
            width={80}
            height={80}
          />
          <h1 className="text-2xl font-normal">Something went wrong</h1>
          <p className="text-muted-foreground">
            Please try refreshing the page or contact support if the problem
            persists.
          </p>
          <Button asChild>
            <Link href="/" className="mt-4">
              <SmartIcon name="ArrowLeft" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
