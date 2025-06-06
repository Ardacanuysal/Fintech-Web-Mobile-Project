import React from 'react';
import classNames from 'classnames';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  bordered = true,
  hoverable = false,
}) => {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const cardClasses = classNames(
    'bg-white rounded-lg shadow-sm',
    paddingMap[padding],
    {
      'border border-gray-200': bordered,
      'transition-shadow duration-200 hover:shadow-md': hoverable,
    },
    className
  );

  return <div className={cardClasses}>{children}</div>;
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={classNames('mb-4', className)}>{children}</div>;
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <h3 className={classNames('text-lg font-semibold', className)}>{children}</h3>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={className}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={classNames('mt-4 pt-4 border-t border-gray-100', className)}>{children}</div>;
};

export default Card;