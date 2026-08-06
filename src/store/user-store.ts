import { createStore } from "zustand/vanilla";
import { Profile } from "@/types/database";

export interface UserState {
  profile: Profile | null;
}

export interface UserActions {
  setProfile: (profile: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => void;
}

export type UserStore = UserState & UserActions;

export const createUserStore = (initProps?: Partial<UserState>) => {
  return createStore<UserStore>()((set) => ({
    profile: null,
    ...initProps,
    setProfile: (profile) => set({ profile }),
    updateProfile: (updates) =>
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      })),
  }));
};
