import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '@/services/aiService';
import { ChatMessage } from '@/types';
import { COLORS } from '@/constants/theme';

const QUICK_PROMPTS = [
  'Best motorcycle for city commuting under ₱500/day',
  'I need a bike for a road trip with a passenger',
  'Compare scooters vs underbone motorcycles',
  'What do I need to rent a motorcycle?',
];

export default function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm your MotorRent AI assistant. I can help you find the perfect motorcycle based on your budget, travel purpose, and passenger needs. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await aiService.chat(text.trim(), history);
      if (!res.success) {
        throw new Error(res.message || 'AI request failed');
      }
      const reply = res.data?.reply || 'Sorry, I could not process your request.';
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        'Sorry, the AI assistant is temporarily unavailable. Please browse motorcycles manually or try again later.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: msg,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color={COLORS.info} />
        <Text style={styles.disclaimerText}>AI provides recommendations only. To book, use the Book Now button on motorcycle details.</Text>
      </View>

      {messages.length <= 1 && (
        <View style={styles.prompts}>
          {QUICK_PROMPTS.map((prompt) => (
            <TouchableOpacity key={prompt} style={styles.promptChip} onPress={() => sendMessage(prompt)}>
              <Text style={styles.promptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            {item.role === 'assistant' && (
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={14} color={COLORS.primary} />
                <Text style={styles.aiLabel}>MotorRent AI</Text>
              </View>
            )}
            <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>{item.content}</Text>
          </View>
        )}
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primary} style={styles.loader} /> : null}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about motorcycles..."
          placeholderTextColor={COLORS.textLight}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.info + '10', padding: 12, margin: 12, borderRadius: 10 },
  disclaimerText: { flex: 1, fontSize: 12, color: COLORS.info, lineHeight: 16 },
  prompts: { paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  promptChip: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 6 },
  promptText: { fontSize: 13, color: COLORS.text },
  messages: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '85%', marginBottom: 12, padding: 14, borderRadius: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  aiLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  bubbleText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  userText: { color: '#fff' },
  loader: { marginVertical: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  input: { flex: 1, backgroundColor: COLORS.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: COLORS.text, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
});
