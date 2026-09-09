import { Pagination } from './common';

export interface TableColumn {
  name?: string;
  title?: string;
  type?:
    | 'copy'
    | 'image'
    | 'time'
    | 'label'
    | 'dropdown'
    | 'user'
    | 'json_preview';
  placeholder?: string;
  metadata?: any;
  className?: string;
  callback?: (item: any) => any;
}

export interface Table {
  title?: string;
  columns: TableColumn[];
  data: any[];
  emptyMessage?: string;
  pagination?: Pagination;
  actions?: Button[];
}
