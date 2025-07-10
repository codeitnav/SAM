import { Stack } from "expo-router"
import { AuthProvider } from "@/context/AuthContext"
import AuthWrapper from "@/components/AuthWrapper"

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthWrapper>
    </AuthProvider>
  )
}