import React from 'react';

export interface NavItem {
  icon: React.ReactNode;
  name: string;
  path: string;
  subItems?: Array<{
    name: string;
    path: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
  }>;
  adminOnly?: boolean;
} 