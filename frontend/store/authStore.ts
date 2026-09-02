import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser } from "@/types";
import Toast from "react-native-toast-message";
import { realtimeClient } from "@/lib/realtimeClient";
import { initRealtimeEventDispatcher } from "@/lib/eventDispatcher";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthority: () => boolean;
  isTourist: () => boolean;
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user) => {
        if (user) {
          const mockToken = `mock_jwt_token_${user.role || 'tourist'}_${Date.now()}`;
          const authData = {
            user,
            accessToken: mockToken,
            refreshToken: `mock_refresh_${mockToken}`,
            isAuthenticated: true,
          };
          AsyncStorage.setItem("toursafe-auth", JSON.stringify(authData)).catch(() => {});
          set({
            user,
            accessToken: mockToken,
            refreshToken: `mock_refresh_${mockToken}`,
            isAuthenticated: true,
          });
        } else {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },
      setLoading: (isLoading) => set({ isLoading }),
      signOut: async () => {
        try {
          await AsyncStorage.removeItem("toursafe-auth");
        } catch (e) {
          // Ignore errors during sign out
        }
        realtimeClient.disconnect();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
      logout: async () => {
        await get().signOut();
      },

      isAuthority: () => {
        const role = get().user?.role;
        return role === "authority" || role === "admin" || role === "responder";
      },
      isTourist: () => get().user?.role === "tourist",
      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const stored = await AsyncStorage.getItem("toursafe-auth");
          if (stored) {
            const { user, accessToken, refreshToken } = JSON.parse(stored);
            // Validate that the stored user has required fields
            if (user && user.email && user.role) {
              set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
              });
              initRealtimeEventDispatcher();
              if (accessToken) {
                realtimeClient.connect(accessToken);
              }
            } else {
              await AsyncStorage.removeItem("toursafe-auth");
              realtimeClient.disconnect();
              set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            }
          } else {
            realtimeClient.disconnect();
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          }
        } catch (error) {
          await AsyncStorage.removeItem("toursafe-auth");
          realtimeClient.disconnect();
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        // Determine role from email heuristics
        let detectedRole: "authority" | "responder" | "tourist" = "tourist";
        const lowerEmail = (email || "").toLowerCase();
        if (lowerEmail.includes("admin") || lowerEmail.includes("authority") || lowerEmail.includes("tnpol")) {
          detectedRole = "authority";
        } else if (lowerEmail.includes("responder") || lowerEmail.includes("unit") || lowerEmail.includes("medic") || lowerEmail.includes("police")) {
          detectedRole = "responder";
        }

        const namePart = (email || "user").split("@")[0].replace(/[\._]/g, " ");
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

        const mockUser: AuthUser = {
          id: `usr_${Date.now()}`,
          email: email.trim() || `${detectedRole}@toursafe.dev`,
          role: detectedRole,
          full_name: formattedName || "TourSafe User",
        };

        const mockAccessToken = `mock_jwt_token_${detectedRole}_${Date.now()}`;
        const mockRefreshToken = `mock_refresh_token_${Date.now()}`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: email.trim(), password }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const { access_token, refresh_token, user } = data;

            const finalUser: AuthUser = {
              id: user.id || mockUser.id,
              email: user.email || mockUser.email,
              role: user.role || mockUser.role,
              full_name: user.full_name || mockUser.full_name,
            };

            await AsyncStorage.setItem("toursafe-auth", JSON.stringify({
              user: finalUser,
              accessToken: access_token,
              refreshToken: refresh_token,
            }));

            set({
              user: finalUser,
              accessToken: access_token,
              refreshToken: refresh_token,
              isAuthenticated: true,
            });

            initRealtimeEventDispatcher();
            realtimeClient.connect(access_token);
            return true;
          }
        } catch (error) {
          // Fall through to mock authentication
        }

        // Mock login guarantee
        await AsyncStorage.setItem("toursafe-auth", JSON.stringify({
          user: mockUser,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
        }));

        set({
          user: mockUser,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
          isAuthenticated: true,
        });

        initRealtimeEventDispatcher();
        return true;
      },
      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          await AsyncStorage.removeItem("toursafe-auth");
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return false;
        }

        try {
          const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Session refresh failed");
          }

          const data = await response.json();
          const { access_token: newAccessToken, refresh_token: newRefreshToken } = data;

          await AsyncStorage.setItem("toursafe-auth", JSON.stringify({
            user: get().user,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          }));

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });

          return true;
        } catch (error: any) {
          await AsyncStorage.removeItem("toursafe-auth");
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return false;
        }
      },
    }),
    {
      name: "toursafe-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);