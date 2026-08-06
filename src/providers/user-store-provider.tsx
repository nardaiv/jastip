"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { type StoreApi, useStore } from "zustand";
import { createUserStore, type UserStore, type UserState } from "@/store/user-store";

export const UserStoreContext = createContext<StoreApi<UserStore> | null>(null);

export interface UserStoreProviderProps {
  children: ReactNode;
  initialState?: Partial<UserState>;
}

export const UserStoreProvider = ({
  children,
  initialState,
}: UserStoreProviderProps) => {
  const storeRef = useRef<StoreApi<UserStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createUserStore(initialState);
  }

  return (
    <UserStoreContext.Provider value={storeRef.current}>
      {children}
    </UserStoreContext.Provider>
  );
};

export const useUserStore = <T,>(selector: (store: UserStore) => T): T => {
  const userStoreContext = useContext(UserStoreContext);

  if (!userStoreContext) {
    throw new Error(`useUserStore must be used within UserStoreProvider`);
  }

  return useStore(userStoreContext, selector);
};
