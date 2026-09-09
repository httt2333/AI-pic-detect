import { Trash } from 'lucide-react';

import {
  TableBody,
  TableCell,
  Table as TableComponent,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { type Pagination } from '@/shared/types/blocks/common';
import { type TableColumn } from '@/shared/types/blocks/table';

import { Copy } from './copy';
import { Dropdown } from './dropdown';
import { Image } from './image';
import { JsonPreview } from './json-preview';
import { Label } from './label';
import { Time } from './time';
import { User } from './user';

export function Table({
  columns,
  data,
  emptyMessage,
  pagination,
}: {
  columns?: TableColumn[];
  data?: any[];
  emptyMessage?: string;
  pagination?: Pagination;
}) {
  if (!columns) {
    columns = [];
  }

  return (
    <TableComponent className="w-full">
      <TableHeader className="">
        <TableRow className="rounded-md">
          {columns &&
            columns.map((item: TableColumn, idx: number) => {
              return (
                <TableHead key={idx} className={item.className}>
                  {item.title}
                </TableHead>
              );
            })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data && data.length > 0 ? (
          data.map((item: any, idx: number) => (
            <TableRow key={idx} className="h-16">
              {columns &&
                columns.map((column: TableColumn, iidx: number) => {
                  const value = item[column.name as keyof typeof item];

                  const content = column.callback
                    ? column.callback(item)
                    : value;

                  let cellContent = content;

                  if (column.type === 'image') {
                    cellContent = (
                      <Image
                        placeholder={column.placeholder}
                        value={value}
                        metadata={column.metadata}
                        className={column.className}
                      />
                    );
                  } else if (column.type === 'time') {
                    cellContent = (
                      <Time
                        placeholder={column.placeholder}
                        value={value}
                        metadata={column.metadata}
                        className={column.className}
                      />
                    );
                  } else if (column.type === 'label') {
                    cellContent = (
                      <Label
                        placeholder={column.placeholder}
                        value={value}
                        metadata={column.metadata}
                        className={column.className}
                      />
                    );
                  } else if (column.type === 'copy' && value) {
                    cellContent = (
                      <Copy
                        placeholder={column.placeholder}
                        value={value}
                        metadata={column.metadata}
                        className={column.className}
                      >
                        {content}
                      </Copy>
                    );
                  } else if (column.type === 'dropdown') {
                    cellContent = (
                      <Dropdown
                        placeholder={column.placeholder}
                        value={content}
                        metadata={column.metadata}
                        className={column.className}
                      />
                    );
                  } else if (column.type === 'user') {
                    cellContent = (
                      <User
                        placeholder={column.placeholder}
                        value={value}
                        metadata={column.metadata}
                        className={column.className}
                      />
                    );
                  } else if (column.type === 'json_preview') {
                    cellContent = (
                      <JsonPreview
                        placeholder={column.placeholder}
                        value={value}
                        metadata={column.metadata}
                        className={column.className}
                      />
                    );
                  }

                  return (
                    <TableCell key={iidx} className={column.className}>
                      {cellContent || column.placeholder}
                    </TableCell>
                  );
                })}
            </TableRow>
          ))
        ) : (
          <TableRow className="">
            <TableCell colSpan={columns.length}>
              <div className="text-muted-foreground flex w-full items-center justify-center py-8">
                {emptyMessage ? (
                  <p>{emptyMessage}</p>
                ) : (
                  <Trash className="h-10 w-10" />
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </TableComponent>
  );
}

export * from './table-card';
