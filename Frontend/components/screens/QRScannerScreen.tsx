import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const QRScannerScreen = () => {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const getCameraPermissions = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error('Error requesting camera permissions:', error);
        setHasPermission(false);
      }
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    console.log('QR Code scanned:', { type, data });
    
    // More flexible QR code validation
    if (data.toLowerCase().includes('walmart') || 
        data.toLowerCase().includes('store') || 
        data.startsWith('http')) {
      Alert.alert(
        'QR Code Scanned Successfully!',
        `Scanned: ${data}\n\nOpening SAM Assistant...`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setScanned(false),
          },
          {
            text: 'Continue',
            onPress: () => {
              try {
                router.push('/(tabs)/chatbot');
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Navigation Error', 'Could not navigate to chatbot screen.');
                setScanned(false);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'QR Code Detected',
        `Scanned content: ${data}\n\nThis doesn't appear to be a store QR code.`,
        [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Use Anyway',
            onPress: () => {
              try {
                router.push('/(tabs)/chatbot');
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Navigation Error', 'Could not navigate to chatbot screen.');
                setScanned(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleGoBack = () => {
    try {
      router.back();
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      router.push('/(tabs)');
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.centerContent}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#666" style={styles.icon} />
          <Text style={styles.message}>Camera access is required to scan QR codes</Text>
          <Text style={styles.subMessage}>
            Please enable camera permissions in your device settings
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleGoBack}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
      </View>

      {showInstructions && (
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>How to use QR Scanner</Text>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodeFrame}>
                <Text style={styles.walmartLabel}>Walmart Store</Text>
                <Text style={styles.qrCodeText}>
                  Scan QR codes for shopping assistance{'\n'}
                  No order minimum from Walmart.com
                </Text>
                <View style={styles.qrCodePlaceholder}>
                  <Ionicons name="qr-code-outline" size={60} color="#666" />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.linkText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showInstructions && (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417"],
            }}
          />
          
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <Text style={styles.scannerText}>
              Position the QR code within the frame
            </Text>
          </View>

          {scanned && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5dade2',
    padding: 20,
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCodeContainer: {
    marginBottom: 25,
  },
  qrCodeFrame: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  walmartLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  qrCodeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 16,
  },
  qrCodePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  linkButton: {
    backgroundColor: '#5dade2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 150,
  },
  linkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#5dade2',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#5dade2',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#5dade2',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#5dade2',
  },
  scannerText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#5dade2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  subMessage: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 14,
    marginBottom: 30,
    lineHeight: 20,
  },
  icon: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#5dade2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScannerScreen;