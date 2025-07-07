"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native"
import * as Clipboard from "expo-clipboard"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps"
import * as Location from "expo-location"
import { debounce } from "@/utils/debounce"

const { width, height } = Dimensions.get("window")

interface UserLocation {
  latitude: number
  longitude: number
}

interface AddressInfo {
  street?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  postalCode?: string | null
  formattedAddress?: string
}

const MapScreen = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const regionRef = useRef<Region>({
    latitude: params.latitude ? Number.parseFloat(params.latitude as string) : 37.78825,
    longitude: params.longitude ? Number.parseFloat(params.longitude as string) : -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })
  const [region, setRegion] = useState<Region>(regionRef.current)
  const alertShownRef = useRef(false)

  // Debounced region update to prevent infinite loops
  const debouncedRegionUpdate = useCallback(
    debounce((newRegion: Region) => {
      const threshold = 0.001
      if (
        Math.abs(newRegion.latitude - regionRef.current.latitude) > threshold ||
        Math.abs(newRegion.longitude - regionRef.current.longitude) > threshold
      ) {
        regionRef.current = newRegion
        setRegion(newRegion)
      }
    }, 300),
    [],
  )

  // Function to get address from coordinates
  const getAddressFromCoordinates = useCallback(async (latitude: number, longitude: number) => {
    try {
      setIsLoadingAddress(true)
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      })

      if (addressResponse && addressResponse.length > 0) {
        const address = addressResponse[0]
        const addressInfo: AddressInfo = {
          street: address.street || address.name || null,
          city: address.city || address.subregion || null,
          region: address.region || null,
          country: address.country || null,
          postalCode: address.postalCode || null,
        }

        // Create formatted address with better formatting
        const addressParts = [
          addressInfo.street,
          addressInfo.city,
          addressInfo.region,
          addressInfo.country
        ].filter(part => part && part.trim() !== "")

        addressInfo.formattedAddress = addressParts.length > 0 
          ? addressParts.join(", ") 
          : "Address not available"
        
        setAddressInfo(addressInfo)
      } else {
        setAddressInfo({
          formattedAddress: "Address not available",
        })
      }
    } catch (error) {
      console.error("Error getting address:", error)
      setAddressInfo({
        formattedAddress: "Address not available",
      })
    } finally {
      setIsLoadingAddress(false)
    }
  }, [])

  useEffect(() => {
    if (params.latitude && params.longitude) {
      const newLocation = {
        latitude: Number.parseFloat(params.latitude as string),
        longitude: Number.parseFloat(params.longitude as string),
      }
      setUserLocation(newLocation)

      const newRegion = {
        ...newLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
      regionRef.current = newRegion
      setRegion(newRegion)

      // Get address for the passed coordinates
      getAddressFromCoordinates(newLocation.latitude, newLocation.longitude)
    }
  }, [params.latitude, params.longitude, getAddressFromCoordinates])

  const showAlert = useCallback((title: string, message: string) => {
    if (!alertShownRef.current) {
      alertShownRef.current = true
      Alert.alert(title, message, [
        {
          text: "OK",
          onPress: () => {
            alertShownRef.current = false
          },
        },
      ])
    }
  }, [])

  const getCurrentLocation = useCallback(async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== "granted") {
        showAlert("Permission denied", "Location permission is required")
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const newLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }

      setUserLocation(newLocation)

      const newRegion = {
        ...newLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }

      regionRef.current = newRegion
      setRegion(newRegion)

      // Get address for the new location
      await getAddressFromCoordinates(newLocation.latitude, newLocation.longitude)
    } catch (error) {
      console.error("Error getting location:", error)
      showAlert("Error", "Failed to get current location")
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, showAlert, getAddressFromCoordinates])

  const handleMapPress = useCallback((event: any) => {
    const { coordinate } = event.nativeEvent
    console.log("Map pressed at:", coordinate)
  }, [])

  const handleRegionChangeComplete = useCallback(
    (newRegion: Region) => {
      debouncedRegionUpdate(newRegion)
    },
    [debouncedRegionUpdate],
  )

  const copyAddressToClipboard = useCallback(() => {
    if (addressInfo?.formattedAddress) {
      Clipboard.setStringAsync(addressInfo.formattedAddress)
      showAlert("Copied!", "Address copied to clipboard")
    } else {
      showAlert("No Address", "No address available to copy")
    }
  }, [addressInfo, showAlert])

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#5dade2" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Your Location</Text>

        <View style={styles.headerButton} />
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        onRegionChangeComplete={handleRegionChangeComplete}
        loadingEnabled={true}
        loadingIndicatorColor="#5dade2"
      >
        {userLocation && (
          <Marker coordinate={userLocation} title="Your Location" description="You are here" pinColor="#5dade2">
            <View style={styles.markerContainer}>
              <Ionicons name="location" size={30} color="#5dade2" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Enhanced Location Info */}
      {userLocation && (
        <View style={styles.locationInfo}>
          <View style={styles.locationHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="navigate" size={20} color="#5dade2" />
              <Text style={styles.locationTitle}>Current Location</Text>
            </View>
            {isLoadingAddress && (
              <View style={styles.loadingContainer}>
                <Ionicons name="hourglass" size={16} color="#5dade2" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}
          </View>

          {/* Primary Address Display */}
          {addressInfo && (
            <View style={styles.primaryAddressContainer}>
              <View style={styles.addressIconRow}>
                <Ionicons name="location" size={18} color="#5dade2" />
                <Text style={styles.primaryAddressText}>
                  {addressInfo.formattedAddress}
                </Text>
              </View>
            </View>
          )}

          {/* Detailed Address Components */}
          {addressInfo && (
            <View style={styles.addressDetailsContainer}>
              {addressInfo.postalCode && (
                <View style={styles.addressDetailRow}>
                  <Text style={styles.addressDetailLabel}>Postal Code:</Text>
                  <Text style={styles.addressDetailValue}>{addressInfo.postalCode}</Text>
                </View>
              )}
            </View>
          )}

          {/* Coordinates */}
          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinatesTitle}>Coordinates</Text>
            <View style={styles.coordinatesGrid}>
              <View style={styles.coordinateItem}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <Text style={styles.coordinateValue}>{userLocation.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.coordinateItem}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <Text style={styles.coordinateValue}>{userLocation.longitude.toFixed(6)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, (isLoading || isLoadingAddress) && styles.actionButtonDisabled]}
          onPress={getCurrentLocation}
          disabled={isLoading || isLoadingAddress}
        >
          <Ionicons name={isLoading ? "hourglass" : "locate"} size={20} color="white" />
          <Text style={styles.actionButtonText}>
            {isLoading ? "Finding..." : isLoadingAddress ? "Getting Address..." : "Find Me"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.copyButton]} 
          onPress={copyAddressToClipboard}
          disabled={!addressInfo?.formattedAddress}
        >
          <Ionicons name="copy" size={20} color="#5dade2" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  map: {
    flex: 1,
    width: width,
    height: height - 200,
  },
  markerContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationInfo: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  loadingText: {
    fontSize: 12,
    color: "#5dade2",
    fontStyle: "italic",
  },
  primaryAddressContainer: {
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: "#5dade2",
  },
  addressIconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  primaryAddressText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    lineHeight: 22,
  },
  addressDetailsContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  addressDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  addressDetailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    minWidth: 80,
  },
  addressDetailValue: {
    fontSize: 12,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  coordinatesContainer: {
    marginTop: 5,
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  coordinatesGrid: {
    flexDirection: "row",
    gap: 12,
  },
  coordinateItem: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  coordinateLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
    marginBottom: 2,
  },
  coordinateValue: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#5dade2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#5dade2",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#5dade2",
  },
  copyButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#5dade2",
    flex: 0,
    width: 50,
    paddingHorizontal: 0,
  },
})

export default MapScreen;