"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import WebSocketService, { type ChatMessage, type WebSocketMessage } from "@/utils/WebSocketService"
import TypingIndicator from "../TypingIndicator" // Correct import path

const ChatbotScreen = () => {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const flatListRef = useRef<FlatList>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Helper function to create user message
  const createUserMessage = (text: string): ChatMessage => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    text,
    isUser: true,
    timestamp: new Date(),
  })

  // Helper function to create bot message
  const createBotMessage = (text: string, error = false): ChatMessage => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    text,
    isUser: false,
    timestamp: new Date(),
    error,
  })

  useEffect(() => {
    // Keyboard event listeners
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    )
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0))

    // Initialize WebSocket connection
    const initializeChat = async () => {
      try {
        console.log("🚀 Initializing WebSocket connection...")
        await WebSocketService.connect()
        console.log("✅ WebSocket connected successfully")
        setIsLoading(false)
      } catch (error) {
        console.error("❌ WebSocket connection failed:", error)
        setIsLoading(false)
        // Replace welcome message with connection error
        setMessages([
          {
            id: "error-1",
            text: "Unable to connect to SAM AI. Please check your internet connection and try again.",
            isUser: false,
            timestamp: new Date(),
            error: true,
          },
        ])
      }
    }

    // Set up WebSocket event listeners
    WebSocketService.onConnectionChange((connected) => {
      console.log("🔌 Connection status changed:", connected)
      setIsConnected(connected)
      if (!connected && !isLoading) {
        const errorMessage = createBotMessage("Connection lost. Please check your internet connection.", true)
        setMessages((prev) => [...prev, errorMessage])
      }
    })

    WebSocketService.onMessage(handleWebSocketMessage)

    initializeChat()

    // Cleanup on unmount
    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
      WebSocketService.disconnect()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleWebSocketMessage = (wsMessage: WebSocketMessage) => {
    console.log("📨 Received WebSocket message:", wsMessage)

    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    switch (wsMessage.type) {
      case "bot_response":
        console.log("🧠 Bot response received:", wsMessage.message)
        setIsTyping(false)
        if (wsMessage.message) {
          const botMessage = createBotMessage(wsMessage.message)
          setMessages((prev) => [...prev, botMessage])
        }
        break
      case "error":
        console.error("⚠ WebSocket error:", wsMessage.error)
        setIsTyping(false)
        const errorMessage = createBotMessage(wsMessage.error || "Something went wrong. Please try again.", true)
        setMessages((prev) => [...prev, errorMessage])
        break
      default:
        console.log("❓ Unknown message type:", wsMessage.type)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim()) return

    // Check if connected before sending
    if (!isConnected) {
      const errorMessage = createBotMessage("No internet connection. Please check your connection and try again.", true)
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    const userMessage = createUserMessage(inputText)
    setMessages((prev) => [...prev, userMessage])

    const messageText = inputText.trim()
    setInputText("")

    console.log("📤 Sending message:", messageText)

    // Show typing indicator immediately
    setIsTyping(true)

    // Set a fallback timeout for typing indicator (15 seconds)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      console.log("⏰ Typing indicator timeout - hiding")
      setIsTyping(false)
      // Add timeout error message
      const timeoutMessage = createBotMessage("Request timed out. Please try again.", true)
      setMessages((prev) => [...prev, timeoutMessage])
    }, 15000)

    // Send message via WebSocket (plain string like dummy frontend)
    const sent = WebSocketService.sendMessage(messageText)
    if (!sent) {
      // Clear typing indicator and timeout
      setIsTyping(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      // Show error if message couldn't be sent
      const errorMessage = createBotMessage("Failed to send message. Please check your connection and try again.", true)
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
        item.error && styles.errorMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.isUser ? styles.userMessageText : styles.botMessageText,
          item.error && styles.errorMessageText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  )

  // Render typing indicator as footer component
  const renderFooter = () => {
    if (!isTyping) return null
    return (
      <View style={styles.typingIndicatorContainer}>
        <TypingIndicator isVisible={isTyping} />
      </View>
    )
  }

  const retryConnection = async () => {
    setIsLoading(true)
    try {
      console.log("🔄 Retrying connection...")
      await WebSocketService.connect()
      setIsLoading(false)
      // Reset to welcome message on successful connection
      setMessages([
        {
          id: "welcome-retry",
          text: "Hello! I'm SAM, your shopping assistant. How can I help you today?",
          isUser: false,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("❌ Retry connection failed:", error)
      setIsLoading(false)
      const errorMessage = createBotMessage("Still unable to connect. Please check your internet connection.", true)
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const showConnectionDebug = () => {
    const state = WebSocketService.getConnectionState()
    const stateText =
      {
        0: "CONNECTING",
        1: "OPEN",
        2: "CLOSING",
        3: "CLOSED",
      }[state] || "UNKNOWN"

    Alert.alert(
      "Connection Debug",
      `WebSocket State: ${stateText} (${state})\nConnected: ${isConnected}\nURL: ${WebSocketService.getUrl()}`,
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Connecting to SAM AI...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#5dade2" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={showConnectionDebug}>
            <Text style={styles.headerTitle}>SAM</Text>
          </TouchableOpacity>
          <View style={styles.connectionStatusContainer}>
            {!isConnected && (
              <TouchableOpacity onPress={retryConnection} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <View style={[styles.messagesContainer, { marginBottom: keyboardHeight }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          ListFooterComponent={renderFooter}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true })
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false })
          }}
        />
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={[
          styles.inputContainer,
          {
            marginBottom: Platform.OS === "android" ? keyboardHeight : 0,
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={24} color="#5dade2" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder={isConnected ? "Type here" : "No connection..."}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            editable={isConnected}
          />
          <TouchableOpacity
            style={[styles.sendButton, { opacity: inputText.trim() && isConnected ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!inputText.trim() || !isConnected}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
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
  backButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    color: "#5dade2",
    fontFamily: "PixelifySans",
  },
  connectionStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  connectionStatus: {
    fontSize: 12,
    color: "#666",
  },
  retryButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#5dade2",
    borderRadius: 10,
  },
  retryText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 34,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContent: {
    paddingVertical: 20,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: "80%",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#5dade2",
    borderBottomRightRadius: 5,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e9ecef",
    borderBottomLeftRadius: 5,
  },
  errorMessage: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb",
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "white",
  },
  botMessageText: {
    color: "#333",
  },
  errorMessageText: {
    color: "#721c24",
  },
  typingIndicatorContainer: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 5,
  },
  inputContainer: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f8f9fa",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    maxHeight: 100,
    minHeight: 20,
    marginHorizontal: 10,
    textAlignVertical: "center",
  },
  micButton: {
    padding: 5,
  },
  sendButton: {
    backgroundColor: "#5dade2",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default ChatbotScreen
