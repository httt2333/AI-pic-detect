'use client';

import type { JSX } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/components/ui/pagination';

type PaginatorProps = {
  total?: number;
  perPage?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
  showPreviousNext: boolean;
  className?: string;
};

function Paginator({
  total,
  perPage,
  currentPage,
  totalPages,
  onPageChange,
  showPreviousNext,
  className,
}: PaginatorProps) {
  return (
    <PaginationComponent className={className}>
      <PaginationContent className="flex w-full justify-center">
        <div className="text-muted-foreground text-sm">
          Total: {total}, Page: {currentPage} / {totalPages}
        </div>
        <div className="flex-1"></div>
        {showPreviousNext && totalPages && currentPage - 1 >= 1 ? (
          <PaginationItem className="cursor-pointer" key={'prev'}>
            <PaginationPrevious
              onClick={() => {
                if (currentPage - 1 >= 1) {
                  onPageChange(currentPage - 1);
                }
              }}
              className="cursor-pointer"
              //   disabled={currentPage - 1 < 1}
            />
          </PaginationItem>
        ) : null}
        {generatePaginationLinks(currentPage, totalPages, onPageChange)}
        {showPreviousNext && totalPages && currentPage + 1 <= totalPages ? (
          <PaginationItem className="cursor-pointer" key={'next'}>
            <PaginationNext
              onClick={() => {
                if (currentPage + 1 <= totalPages) {
                  onPageChange(currentPage + 1);
                }
              }}
              //   disabled={currentPage > totalPages - 1}
            />
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </PaginationComponent>
  );
}

const generatePaginationLinks = (
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
) => {
  const pages: JSX.Element[] = [];
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <PaginationItem className="cursor-pointer" key={`page-${i}`}>
          <PaginationLink
            onClick={() => i !== currentPage && onPageChange(i)}
            isActive={i == currentPage}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
  } else {
    for (let i = 1; i <= 2; i++) {
      pages.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink
            onClick={() => i !== currentPage && onPageChange(i)}
            isActive={i === currentPage}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    if (2 < currentPage && currentPage < totalPages - 1) {
      pages.push(<PaginationEllipsis key={'ellipsis-1'} />);
      pages.push(
        <PaginationItem key={'page-current'}>
          <PaginationLink
            onClick={() => onPageChange(currentPage)}
            isActive={true}
            className="cursor-pointer"
          >
            {currentPage}
          </PaginationLink>
        </PaginationItem>
      );
    }
    pages.push(<PaginationEllipsis key={'ellipsis-2'} />);
    for (let i = totalPages - 1; i <= totalPages; i++) {
      pages.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink
            onClick={() => i !== currentPage && onPageChange(i)}
            isActive={i === currentPage}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
  }
  return pages;
};

export function Pagination({
  total,
  limit,
  page = 1,
  url,
  className,
}: {
  total: number;
  limit: number;
  page?: number;
  url?: string;
  className?: string;
}) {
  if (limit <= 0) {
    limit = 30;
  }
  const totalPages = Math.ceil(total / limit);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Paginator
      total={Number(total)}
      perPage={Number(limit)}
      currentPage={Number(page)}
      totalPages={Number(totalPages)}
      onPageChange={handlePageChange}
      showPreviousNext={true}
      className={className}
    />
  );
}
