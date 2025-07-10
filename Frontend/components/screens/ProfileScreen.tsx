"use client";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const ProfileScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleSignUp = () => {
    router.push("/(tabs)/auth?mode=signup" as const)
  };

  const handleSignIn = () => {
    router.push("/(tabs)/auth?mode=signin" as const)
  };

  const menuItems = [
    { id: 1, title: "Personal Information", icon: "person-outline" },
    { id: 2, title: "Preferences", icon: "settings-outline" },
    { id: 3, title: "Order History", icon: "receipt-outline" },
    { id: 4, title: "Saved Items", icon: "heart-outline" },
    { id: 5, title: "Help & Support", icon: "help-circle-outline" },
    { id: 6, title: "About", icon: "information-circle-outline" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#5dade2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color="#5dade2" />
        </View>
        {user ? (
          <>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name || "Welcome User"}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || "user@example.com"}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.userName}>Welcome to SAM</Text>
            <Text style={styles.userEmail}>Sign in to access your account</Text>
          </>
        )}
      </View>

      {!user ? (
        // Show auth buttons for non-authenticated users
        <View style={styles.authSection}>
          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Ionicons name="person-add-outline" size={24} color="white" />
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Ionicons name="log-in-outline" size={24} color="#5dade2" />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Show menu for authenticated users
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <Ionicons name={item.icon as any} size={24} color="#5dade2" />
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.signOutItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
            <Text style={styles.signOutText}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      )}

      {!user && (
        <View style={styles.guestNotice}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.guestNoticeText}>
            You&apos;re browsing as a guest. Sign in to save your preferences
            and access all features.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  profileSection: {
    backgroundColor: "white",
    alignItems: "center",
    paddingVertical: 30,
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
  },
  authSection: {
    backgroundColor: "white",
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 20,
    gap: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  signUpButton: {
    backgroundColor: "#5dade2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 8,
    gap: 10,
  },
  signUpButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  signInButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#5dade2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 8,
    gap: 10,
  },
  signInButtonText: {
    color: "#5dade2",
    fontSize: 16,
    fontWeight: "600",
  },
  menuSection: {
    backgroundColor: "white",
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  signOutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  signOutText: {
    flex: 1,
    fontSize: 16,
    color: "#ff6b6b",
    marginLeft: 15,
  },
  guestNotice: {
    backgroundColor: "white",
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  guestNoticeText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default ProfileScreen;
