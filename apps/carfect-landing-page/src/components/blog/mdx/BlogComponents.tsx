'use client';

import React from 'react';
import { AlertCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Alert Component
interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  children: React.ReactNode;
}

export function Alert({ type = 'info', children }: AlertProps) {
  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-900 dark:text-green-100',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
    }
  };

  const style = styles[type];

  return (
    <div className={`my-6 p-4 rounded-lg border-l-4 ${style.bg} ${style.border} ${style.text}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>
        <div className="flex-1 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

// Table Component
interface TableProps {
  headers: string[];
  rows: (string | number)[][];
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div className="my-8 overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/50 transition-colors">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-foreground/80 whitespace-normal"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Checkbox List Component
interface CheckboxProps {
  items: string[];
}

export function Checkbox({ items }: CheckboxProps) {
  return (
    <div className="my-6 space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 flex items-center justify-center">
              <div className="w-3 h-3 bg-transparent"></div>
            </div>
          </div>
          <div className="flex-1 text-sm text-foreground/80 leading-relaxed">
            {item}
          </div>
        </div>
      ))}
    </div>
  );
}

// AuthorCard Component
interface AuthorCardProps {
  name: string;
  description: string;
  avatar?: string;
}

export function AuthorCard({ name, description, avatar }: AuthorCardProps) {
  return (
    <div className="my-8 p-6 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-start gap-4">
        {avatar && (
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
              {name.charAt(0)}
            </div>
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">{name}</h4>
          <p className="text-sm text-foreground/70 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
