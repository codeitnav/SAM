
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatbotScreen = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m SAM, your shopping assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userText: string): string => {
    const text = userText.toLowerCase();
    
    if (text.includes('price') || text.includes('cost')) {
      return 'I can help you check prices! What product are you looking for?';
    } else if (text.includes('location') || text.includes('find') || text.includes('where')) {
      return 'I can help you find products in the store. What are you looking for?';
    } else if (text.includes('offer') || text.includes('deal') || text.includes('discount')) {
      return 'Great! Here are some current offers available. Would you like me to show you products on sale?';
    } else if (text.includes('hello') || text.includes('hi')) {
      return 'Hello! I\'m here to help you with your shopping. What can I assist you with today?';
    } else {
      return 'I understand you\'re asking about that. Let me help you find the best solution for your needs!';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.botMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.isUser ? styles.userMessageText : styles.botMessageText
      ]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#5dade2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SAM</Text>
        <TouchableOpacity style={styles.qrButton}>
          <Ionicons name="qr-code" size={24} color="#5dade2" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>SAM is typing...</Text>
          </View>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={24} color="#5dade2" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Type here"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={24} color="#5dade2" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5dade2',
  },
  qrButton: {
    padding: 5,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContainer: {
    paddingVertical: 20,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#5dade2',
    borderBottomRightRadius: 5,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#333',
  },
  typingContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 50,
  },
  cameraButton: {
    marginRight: 10,
    padding: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    minHeight: 20,
  },
  micButton: {
    marginLeft: 10,
    padding: 5,
  },
});

export default ChatbotScreen;
