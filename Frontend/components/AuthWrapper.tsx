"use client"
import type React from "react"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { useAuth } from "@/context/AuthContext"

interface AuthWrapperProps {
  children: React.ReactNode
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5dade2" />
      </View>
    )
  }

  // Always show children, don't force authentication
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

export default AuthWrapper