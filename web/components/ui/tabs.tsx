"use client";

import React, { createContext, useContext, useState } from "react";

// Context a belső állapot kezeléséhez
const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
} | null>(null);

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsContext.Provider
      value={{ activeTab: value, setActiveTab: onValueChange }}
    >
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center ${className}`}>{children}</div>;
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  const isActive = context?.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => context?.setActiveTab(value)}
      className={`${className} ${isActive ? "data-[state=active]" : ""}`}
      data-state={isActive ? "active" : "inactive"}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (context?.activeTab !== value) return null;

  return (
    <div className={className} data-state="active">
      {children}
    </div>
  );
}
