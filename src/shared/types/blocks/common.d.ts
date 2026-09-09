import { ReactNode } from 'react';

// image props for image component
export interface Image {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

// brand props for brand component, contains logo and brand title
export interface Brand {
  title?: string;
  description?: string;
  logo?: Image;
  url?: string;
  target?: string;
  className?: string;
}

// nav item props for nav component
export interface NavItem {
  id?: string;
  name?: string;
  title?: string;
  text?: string;
  description?: string;
  url?: string;
  target?: string;
  type?: string;
  icon_url?: string;
  icon?: string | ReactNode;
  badge?: string;
  image?: Image;
  is_expand?: boolean;
  is_active?: boolean;
  children?: NavItem[];
  className?: string;
}

// nav props for nav component
export interface Nav {
  id?: string;
  title?: string;
  items: NavItem[];
  className?: string;
}

export interface Crumb extends NavItem {}

export interface Tab extends NavItem {}

export interface FilterOption {
  value?: string;
  label: string;
}

export interface Filter {
  name: string;
  title: string;
  value?: string;
  options?: FilterOption[];
}

export interface Search {
  name: string;
  title?: string;
  placeholder?: string;
  value?: string;
}

// button props for button component
export interface Button extends NavItem {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  onClick?: () => void;
}

// social props for social icon component
export interface SocialNav extends Nav {}

// agreement props for agreement component, contains privacy policy and terms of service
export interface AgreementNav extends Nav {}

// user props for user menu component
export interface UserNav extends Nav {
  show_name?: boolean;
  show_credits?: boolean;
  show_sign_out?: boolean;
}

// pagination props for pagination component, used to list data
export interface Pagination {
  total: number;
  page: number;
  limit: number;
}
