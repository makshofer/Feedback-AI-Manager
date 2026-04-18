import { useAuth } from "@/lib/auth";
import { Route, Redirect, useLocation } from "wouter";
import React, { useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
  requireAdmin = false,
}: {
  path: string;
  component: React.ComponentType<any>;
  requireAdmin?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/login" />;
        }

        if (requireAdmin && user.role !== "admin") {
          return <Redirect to="/dashboard" />;
        }

        return <Component params={params} />;
      }}
    </Route>
  );
}
