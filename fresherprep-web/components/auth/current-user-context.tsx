"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { CurrentUser } from "@/lib/auth/types";

interface CurrentUserContextValue {
  user: CurrentUser;
  updateUser: (user: CurrentUser) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ user, updateUser, children }: {
  user: CurrentUser;
  updateUser?: (user: CurrentUser) => void;
  children: ReactNode;
}) {
  return <CurrentUserContext.Provider value={{ user, updateUser: updateUser ?? noopUpdateUser }}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  return useCurrentUserContext().user;
}

export function useUpdateCurrentUser() {
  return useCurrentUserContext().updateUser;
}

function useCurrentUserContext() {
  const context = useContext(CurrentUserContext);
  if (!context) throw new Error("Current user context requires the authenticated app shell");
  return context;
}

function noopUpdateUser() {}
