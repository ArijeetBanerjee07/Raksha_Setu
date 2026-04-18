import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Direct injection to bypass your stale local server cache
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const MODEL_NAME = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `
You are RakshaAI, a critical safety and legal advisor embedded in a women's safety application. 
Your primary goal is to provide immediate, actionable, and accurate advice regarding:
1. What to do when the user feels physically threatened or followed.
2. How to acquire legal assistance in cases of domestic abuse, harassment, or workplace issues.
3. How to confront and communicate effectively with lawyers or police officers.

Keep your answers concise, empathetic, empowering, and highly structured (use bullet points). 
If it sounds like an immediate physical emergency, advise them to trigger the SOS button or invoke the Map safe-zones.
`;

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello. I am your trusted safety advisor. Are you feeling threatened, or do you need legal guidance right now?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  const formatMessagesForGroq = (msgs) => {
    // Map our message formatting to what the Groq OpenAI-compatible API expects
    const formatted = msgs.map(m => ({
      role: m.isUser ? 'user' : 'assistant',
      content: m.text
    }));
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      ...formatted
    ];
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const apiMessages = formatMessagesForGroq([...messages, userMsg]);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: apiMessages,
          temperature: 0.5,
          max_tokens: 600
        })
      });

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        const aiResponse = data.choices[0].message.content;
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: aiResponse.trim(),
          isUser: false,
          timestamp: new Date()
        }]);
      } else {
        throw new Error('Groq Raw Response: ' + JSON.stringify(data));
      }

    } catch (error) {
      console.error('Groq API Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the safety server right now. Please check your internet connection.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text, isUser) => {
    if (isUser) return <Text style={[styles.messageText, styles.userText]}>{text}</Text>;

    const boldRegex = /\*\*(.*?)\*\*/g;
    const lines = text.split('\n');

    return lines.map((line, i) => {
      // Remove empty lines for cleaner UI
      if (line.trim() === '') return null;

      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const content = isBullet ? line.trim().substring(2) : line;
      const parts = content.split(boldRegex);
      
      return (
        <View key={i} style={isBullet ? styles.bulletRow : styles.textRow}>
          {isBullet && <Text style={[styles.messageText, styles.aiText, styles.bulletPoint]}>•</Text>}
          <Text style={[styles.messageText, styles.aiText, { flexShrink: 1 }]}>
            {parts.map((part, j) => {
              // Odd indices are the captured bold groups
              if (j % 2 === 1) {
                return <Text key={j} style={styles.boldText}>{part}</Text>;
              }
              return <Text key={j}>{part}</Text>;
            })}
          </Text>
        </View>
      );
    });
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
      {!item.isUser && (
        <View style={styles.aiAvatar}>
           <Ionicons name="shield-checkmark" size={16} color="#fff" />
        </View>
      )}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {renderFormattedText(item.text, item.isUser)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color="#E8855A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Raksha AI Advisor</Text>
            <Text style={styles.headerSub}>Legal & Safety Guidance</Text>
        </View>
        <View style={{width: 40}} /> 
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView 
        style={styles.chatArea} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#E8855A" />
            <Text style={styles.loadingText}>Analyzing situation...</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your safety or legal question..."
            placeholderTextColor="#64748B"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E8855A',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
  },
  userText: {
    color: '#FFF',
    fontWeight: '500',
  },
  aiText: {
    color: '#F8FAFC',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  textRow: {
    marginBottom: 6,
  },
  bulletPoint: {
    marginRight: 6,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8855A',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 25,
    marginBottom: 15,
  },
  loadingText: {
    color: '#94A3B8',
    marginLeft: 10,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8855A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2, // Align with bottom of input when multiline grows
  }
});
