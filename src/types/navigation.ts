import React from 'react';

export interface NavSubItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
  adminOnly?: boolean;
  new?: boolean;
  pro?: boolean;
}

interface NavItemBase {
  icon: React.ReactNode;
  name: string;
  adminOnly?: boolean;
}

export type NavItem =
  | (NavItemBase & {
      path: string;
      subItems?: undefined;
    })
  | (NavItemBase & {
      subItems: NavSubItem[];
      path?: undefined;
    });