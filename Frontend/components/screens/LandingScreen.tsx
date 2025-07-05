import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Store {
  id: string;
  name: string;
  address: string;
  distance: string;
}

const LandingScreen = () => {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [stores, setStores] = useState<Store[]>([
    {
      id: '1',
      name: 'Walmart Supercenter',
      address: '23, Main street',
      distance: '0.5 mi',
    },
    {
      id: '2',
      name: 'Walmart Supercenter 2',
      address: '23, Main street',
      distance: '1.2 mi',
    },
    {
      id: '3',
      name: 'Walmart Supercenter 3',
      address: '23, Main street',
      distance: '1.8 mi',
    },
    {
      id: '4',
      name: 'Walmart Supercenter 4',
      address: '23, Main street',
      distance: '2.1 mi',
    },
  ]);

  const [fontsLoaded] = useFonts({
    'PixelifySans-Regular': require('../../assets/fonts/PixelifySans-Regular.ttf'),
  });
  
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const renderStore = ({ item }: { item: Store }) => (
    <TouchableOpacity style={styles.storeItem}>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        <Text style={styles.storeAddress}>{item.address}</Text>
      </View>
      <Text style={styles.storeDistance}>{item.distance}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="person-circle" size={32} color="#5dade2" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>SAM</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={getCurrentLocation}
          >
            <Ionicons name="location" size={24} color="#5dade2" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/wallet')}
          >
            <Ionicons name="wallet" size={24} color="#5dade2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nearby Stores Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={20} color="#5dade2" />
          <Text style={styles.sectionTitle}>Nearby stores</Text>
        </View>
        
        <FlatList
          data={stores}
          renderItem={renderStore}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.storesList}
        />
      </View>

      {/* Walmart Cards Section */}
      <View style={styles.cardsContainer}>
        {/* Top row - two smaller cards */}
        <View style={styles.topCardsRow}>
          <TouchableOpacity style={[styles.walmartCard, styles.smallCard]}>
            <ImageBackground 
              source={require('../../assets/images/walmart.jpg')} 
              style={styles.cardBackground}
              imageStyle={styles.cardBackgroundImage}
            >
              <View style={styles.cardOverlay}>
                <View style={styles.walmartBranding}>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Browse{'\n'}Products{'>'}</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.walmartCard, styles.smallCard]}>
            <ImageBackground 
              source={require('../../assets/images/walmart.jpg')} 
              style={styles.cardBackground}
              imageStyle={styles.cardBackgroundImage}
            >
              <View style={styles.cardOverlay}>
                <View style={styles.walmartBranding}>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Browse{'\n'}Offers{'>'}</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Bottom row - one large card */}
        <TouchableOpacity style={[styles.walmartCard, styles.largeCard]}>
          <ImageBackground 
            source={require('../../assets/images/walmart.jpg')} 
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
          >
            <View style={styles.cardOverlay}>
              <View style={styles.walmartBrandingLarge}>
              </View>
              <View style={styles.cardContentLarge}>
                <Text style={styles.cardTitleLarge}>Browse{'\n'}Products{'>'}</Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>

      {/* QR Scanner Button */}
      <TouchableOpacity 
        style={styles.qrButton}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Ionicons name="qr-code" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5dade2',
    fontFamily: 'PixelifySans-Regular',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  storesList: {
    maxHeight: 300,
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
  },
  storeDistance: {
    fontSize: 14,
    color: '#5dade2',
    fontWeight: '500',
  },
  cardsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  topCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  walmartCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  smallCard: {
    width: '48%',
    height: 120,
  },
  largeCard: {
    width: '100%',
    height: 160,
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardBackgroundImage: {
    borderRadius: 15,
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 104, 200, 0.4)',
    padding: 15,
    justifyContent: 'space-between',
  },
  walmartBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  walmartBrandingLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  walmartText: {
    color: '#FFC220',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  walmartTextLarge: {
    color: '#FFC220',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  walmartLogoContainer: {
    backgroundColor: '#FFC220',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walmartLogoContainerLarge: {
    backgroundColor: '#FFC220',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walmartSpark: {
    color: '#004c91',
    fontSize: 12,
    fontWeight: 'bold',
  },
  walmartSparkLarge: {
    color: '#004c91',
    fontSize: 18,
    fontWeight: 'bold',
  },
  supercentereText: {
    color: '#FFC220',
    fontSize: 10,
    fontWeight: '600',
    position: 'absolute',
    top: 35,
    left: 15,
  },
  supercentereTextLarge: {
    color: '#FFC220',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -10,
  },
  cardContent: {
    alignSelf: 'flex-start',
  },
  cardContentLarge: {
    alignSelf: 'flex-start',
  },
  cardTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  cardTitleLarge: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  qrButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#5dade2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default LandingScreen;
