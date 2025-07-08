"use client";

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Alert,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { debounce } from "@/utils/debounce";
import { useFonts } from "expo-font";

interface Store {
  id: string;
  name: string;
  address: string;
  distance: string;
}

const LandingScreen = () => {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const alertShownRef = useRef(false);
  const locationRequestInProgress = useRef(false);

  const [stores] = useState<Store[]>([
    {
      id: "1",
      name: "Walmart Supercenter",
      address: "23, Main street",
      distance: "0.5 mi",
    },
    {
      id: "2",
      name: "Walmart Supercenter 2",
      address: "23, Main street",
      distance: "1.2 mi",
    },
    {
      id: "3",
      name: "Walmart Supercenter 3",
      address: "23, Main street",
      distance: "1.8 mi",
    },
    {
      id: "4",
      name: "Walmart Supercenter 4",
      address: "23, Main street",
      distance: "2.1 mi",
    },
  ]);

  useEffect(() => {
    return () => {
      locationRequestInProgress.current = false;
      alertShownRef.current = false;
    };
  }, []);

  const showAlert = useCallback(
    (title: string, message: string, buttons?: any[]) => {
      if (!alertShownRef.current) {
        alertShownRef.current = true;
        Alert.alert(
          title,
          message,
          buttons || [
            {
              text: "OK",
              onPress: () => {
                alertShownRef.current = false;
              },
            },
          ]
        );
      }
    },
    []
  );

  const debouncedLocationUpdate = useCallback(
    debounce((newLocation: Location.LocationObject) => {
      setLocation(newLocation);
    }, 300),
    []
  );

  const getCurrentLocation = useCallback(async () => {
    if (locationRequestInProgress.current || locationLoading) {
      return;
    }

    try {
      locationRequestInProgress.current = true;
      setLocationLoading(true);
      setLocationError(null);

      console.log("Requesting location permissions...");
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationError("Location permission denied");
        showAlert(
          "Permission Denied",
          "Location permission is required to find nearby stores and show your location on the map.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                alertShownRef.current = false;
              },
            },
            {
              text: "Settings",
              onPress: () => {
                alertShownRef.current = false;
                Location.requestForegroundPermissionsAsync();
              },
            },
          ]
        );
        return;
      }

      console.log("Getting current position...");
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log("Location obtained:", currentLocation);
      debouncedLocationUpdate(currentLocation);

      showAlert(
        "Location Found!",
        `Lat: ${currentLocation.coords.latitude.toFixed(
          4
        )}, Lng: ${currentLocation.coords.longitude.toFixed(4)}`,
        [
          {
            text: "OK",
            onPress: () => {
              alertShownRef.current = false;
            },
          },
          {
            text: "View on Map",
            onPress: () => {
              alertShownRef.current = false;
              handleViewOnMap(currentLocation);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationError("Failed to get location");

      let errorMessage = "Unable to get your current location. ";
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage += "Request timed out. Please try again.";
        } else if (error.message.includes("unavailable")) {
          errorMessage += "Location services are unavailable.";
        } else {
          errorMessage += error.message;
        }
      }

      showAlert("Location Error", errorMessage);
    } finally {
      setLocationLoading(false);
      locationRequestInProgress.current = false;
    }
  }, [locationLoading, showAlert, debouncedLocationUpdate]);

  const handleViewOnMap = useCallback(
    (locationToUse?: Location.LocationObject) => {
      const locationData = locationToUse || location;
      if (locationData) {
        router.push({
          pathname: "/(tabs)/map",
          params: {
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
          },
        });
      } else {
        showAlert("No Location", "Please enable location services first.");
      }
    },
    [location, router, showAlert]
  );

  const handleMapIconPress = useCallback(async () => {
    if (locationRequestInProgress.current || locationLoading) {
      return;
    }

    try {
      locationRequestInProgress.current = true;
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "Location permission is required to show your location on the map.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                alertShownRef.current = false;
              },
            },
            {
              text: "Settings",
              onPress: () => {
                alertShownRef.current = false;
                Location.requestForegroundPermissionsAsync();
              },
            },
          ]
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Navigate directly to map with location
      router.push({
        pathname: "/(tabs)/map",
        params: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
      });
    } catch (error) {
      console.error("Error getting location:", error);
      showAlert("Location Error", "Unable to get your current location.");
    } finally {
      setLocationLoading(false);
      locationRequestInProgress.current = false;
    }
  }, [locationLoading, router, showAlert]);

  const renderStore = useCallback(
    ({ item }: { item: Store }) => (
      <TouchableOpacity style={styles.storeItem}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{item.name}</Text>
          <Text style={styles.storeAddress}>{item.address}</Text>
        </View>
        <Text style={styles.storeDistance}>{item.distance}</Text>
      </TouchableOpacity>
    ),
    []
  );

  const keyExtractor = useCallback((item: Store) => item.id, []);

  const [fontsLoaded] = useFonts({
    PixelifySans: require("../../assets/fonts/PixelifySans-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Ionicons name="person-circle" size={32} color="#5dade2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SAM</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.headerButton,
              locationLoading && styles.headerButtonLoading,
            ]}
            onPress={handleMapIconPress}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color="#5dade2" />
            ) : (
              <Ionicons name="location" size={24} color="#5dade2" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/(tabs)/wallet")}
          >
            <Ionicons name="wallet" size={24} color="#5dade2" />
          </TouchableOpacity>
        </View>
      </View>

      {(location || locationError) && (
        <View style={styles.locationStatus}>
          <Text
            style={[styles.locationText, locationError && styles.locationError]}
          >
            {locationError ||
              `Location: ${location?.coords.latitude.toFixed(
                4
              )}, ${location?.coords.longitude.toFixed(4)}`}
          </Text>
          {location && (
            <TouchableOpacity
              onPress={() => handleViewOnMap()}
              style={styles.viewMapButton}
            >
              <Text style={styles.viewMapText}>View on Map</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Nearby Stores Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={20} color="#5dade2" />
          <Text style={styles.sectionTitle}>Nearby stores</Text>
        </View>
        <FlatList
          data={stores}
          renderItem={renderStore}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          style={styles.storesList}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </View>

      {/* Walmart Cards Section */}
      <View style={styles.cardsContainer}>
        <View style={styles.topCardsRow}>
          <TouchableOpacity style={[styles.walmartCard, styles.smallCard]}>
            <ImageBackground
              source={require("../../assets/images/walmart.jpg")}
              style={styles.cardBackground}
              imageStyle={styles.cardBackgroundImage}
            >
              <View style={styles.cardOverlay}>
                <View style={styles.walmartBranding}></View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>
                    Browse{"\n"}Products{">"}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.walmartCard, styles.smallCard]}>
            <ImageBackground
              source={require("../../assets/images/walmart.jpg")}
              style={styles.cardBackground}
              imageStyle={styles.cardBackgroundImage}
            >
              <View style={styles.cardOverlay}>
                <View style={styles.walmartBranding}></View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>
                    Browse{"\n"}Offers{">"}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.walmartCard, styles.largeCard]}>
          <ImageBackground
            source={require("../../assets/images/walmart.jpg")}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
          >
            <View style={styles.cardOverlay}>
              <View style={styles.walmartBrandingLarge}></View>
              <View style={styles.cardContentLarge}>
                <Text style={styles.cardTitleLarge}>
                  Browse{"\n"}Products{">"}
                </Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => router.push("/(tabs)/explore")}
      >
        <Ionicons name="qr-code" size={32} color="white" />
      </TouchableOpacity>
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
    justifyContent: "space-between",
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
  headerButton: {
    padding: 5,
  },
  headerButtonLoading: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 24,
    color: "#5dade2",
    fontFamily: "PixelifySans",
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
  },
  locationStatus: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationText: {
    fontSize: 12,
    color: "#28a745",
    flex: 1,
  },
  locationError: {
    color: "#ff6b6b",
  },
  viewMapButton: {
    backgroundColor: "#5dade2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewMapText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    backgroundColor: "white",
    margin: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  storesList: {
    maxHeight: 300,
  },
  storeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 14,
    color: "#666",
  },
  storeDistance: {
    fontSize: 14,
    color: "#5dade2",
    fontWeight: "500",
  },
  cardsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  topCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  walmartCard: {
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  smallCard: {
    width: "48%",
    height: 120,
  },
  largeCard: {
    width: "100%",
    height: 160,
  },
  cardBackground: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardBackgroundImage: {
    borderRadius: 15,
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 104, 200, 0.4)",
    padding: 15,
    justifyContent: "space-between",
  },
  walmartBranding: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  walmartBrandingLarge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
  cardContent: {
    alignSelf: "flex-start",
  },
  cardContentLarge: {
    alignSelf: "flex-start",
  },
  cardTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: 18,
  },
  cardTitleLarge: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 22,
  },
  qrButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#5dade2",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default LandingScreen;