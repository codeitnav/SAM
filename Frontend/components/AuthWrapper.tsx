"use client"

import type React from "react"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { useAuth } from "@/context/AuthContext"
import AuthScreen from "./screens/AuthScreen"

interface AuthWrapperProps {
  children: React.ReactNode
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5dade2" />
      </View>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
})

export default AuthWrapper;