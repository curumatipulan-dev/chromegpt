import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Send, Plus, Code2, MessageSquare, Trash2, Copy, Check } from 'lucide-react-native';
import { Colors } from '@/lib/theme';
import { supabase, type ChatSession, type ChatMessage } from '@/lib/supabase';
import { generateAIResponse } from '@/lib/ai';
import { LANGUAGES } from '@/lib/types';

export default function ChatScreen() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSessionList, setShowSessionList] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession.id);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setSessions(data);
      if (data.length > 0 && !activeSession) {
        setActiveSession(data[0]);
      }
    }
    setLoadingSessions(false);
  };

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (!error && data) {
      setMessages(data);
    }
  };

  const createNewSession = async () => {
    const title = `New Chat ${sessions.length + 1}`;
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ title })
      .select()
      .single();
    if (!error && data) {
      setSessions([data, ...sessions]);
      setActiveSession(data);
      setShowSessionList(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);
    if (!error) {
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      if (activeSession?.id === sessionId) {
        setActiveSession(updated[0] || null);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    let session = activeSession;
    if (!session) {
      const title = input.trim().slice(0, 40);
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ title })
        .select()
        .single();
      if (error || !data) return;
      session = data;
      setSessions([data, ...sessions]);
      setActiveSession(data);
    }
    if (!session) return;

    const currentSession = session;
    const userMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      session_id: currentSession.id,
      role: 'user',
      content: input.trim(),
      language: null,
      is_code: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const { error: msgError } = await supabase.from('chat_messages').insert({
      session_id: currentSession.id,
      role: 'user',
      content: input.trim(),
      is_code: false,
    });

    if (msgError) {
      setLoading(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));

    const response = generateAIResponse(input.trim(), { language: selectedLanguage || undefined });

    const { data: assistantData, error: assistantError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSession.id,
        role: 'assistant',
        content: response.content,
        language: response.language,
        is_code: response.isCode,
      })
      .select()
      .single();

    if (!assistantError && assistantData) {
      setMessages((prev) => [...prev, assistantData]);
    }

    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSession.id);

    setLoading(false);
  };

  const copyToClipboard = async (text: string, id: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {item.is_code && item.language && (
            <View style={styles.codeHeader}>
              <View style={styles.codeLabelContainer}>
                <Code2 size={14} color={Colors.primary[300]} strokeWidth={2} />
                <Text style={styles.codeLabel}>{item.language}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(item.content, item.id)}>
                {copiedId === item.id ? (
                  <Check size={14} color={Colors.success[500]} strokeWidth={2} />
                ) : (
                  <Copy size={14} color={Colors.neutral[400]} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
          )}
          {item.is_code ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.codeText}>{item.content}</Text>
            </ScrollView>
          ) : (
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowSessionList(true)}>
          <MessageSquare size={20} color={Colors.neutral[700]} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeSession ? activeSession.title : 'AI Coding Assistant'}
        </Text>
        <TouchableOpacity style={styles.newChatButton} onPress={createNewSession}>
          <Plus size={22} color={Colors.primary[600]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Code2 size={48} color={Colors.primary[500]} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Start a Conversation</Text>
          <Text style={styles.emptySubtitle}>
            Ask me to generate code, debug, refactor, or explain anything
          </Text>
          <View style={styles.suggestionContainer}>
            {[
              'Generate a Python function to sort a list',
              'Debug my JavaScript code',
              'Convert Python to TypeScript',
              'Write unit tests for a Kotlin class',
            ].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => setInput(suggestion)}>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Generating response...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setShowLangPicker(true)}>
          <Text style={styles.langButtonText} numberOfLines={1}>
            {selectedLanguage || 'Auto'}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask me to generate, debug, or refactor code..."
          placeholderTextColor={Colors.neutral[400]}
          multiline
          maxLength={2000}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}>
          <Send size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <Modal visible={showSessionList} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat History</Text>
              <TouchableOpacity onPress={() => setShowSessionList(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.newSessionButton} onPress={createNewSession}>
              <Plus size={20} color={Colors.primary[600]} strokeWidth={2} />
              <Text style={styles.newSessionText}>New Chat</Text>
            </TouchableOpacity>
            <ScrollView style={styles.sessionList}>
              {loadingSessions ? (
                <ActivityIndicator size="large" color={Colors.primary[500]} />
              ) : sessions.length === 0 ? (
                <Text style={styles.emptySessionText}>No conversations yet</Text>
              ) : (
                sessions.map((session) => (
                  <View
                    key={session.id}
                    style={[
                      styles.sessionItem,
                      activeSession?.id === session.id && styles.activeSessionItem,
                    ]}>
                    <TouchableOpacity
                      style={styles.sessionItemContent}
                      onPress={() => {
                        setActiveSession(session);
                        setShowSessionList(false);
                      }}>
                      <MessageSquare size={18} color={Colors.neutral[500]} strokeWidth={2} />
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {session.title}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteSession(session.id)}>
                      <Trash2 size={18} color={Colors.error[500]} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showLangPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.langPickerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLangPicker(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.langList}>
              <TouchableOpacity
                style={[
                  styles.langItem,
                  selectedLanguage === null && styles.langItemSelected,
                ]}
                onPress={() => {
                  setSelectedLanguage(null);
                  setShowLangPicker(false);
                }}>
                <Text style={styles.langItemText}>Auto-detect</Text>
              </TouchableOpacity>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langItem,
                    selectedLanguage === lang && styles.langItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedLanguage(lang);
                    setShowLangPicker(false);
                  }}>
                  <Text style={styles.langItemText}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral[50] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1, borderBottomColor: Colors.neutral[200],
  },
  historyButton: { padding: 8, borderRadius: 8 },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: 'Inter-SemiBold', fontSize: 17, color: Colors.neutral[900],
  },
  newChatButton: { padding: 8, borderRadius: 8 },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96, height: 96, borderRadius: 24,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold', fontSize: 24, color: Colors.neutral[900], marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[500],
    textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  suggestionContainer: { width: '100%', gap: 10 },
  suggestionChip: {
    backgroundColor: Colors.neutral[0], borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: Colors.neutral[200],
  },
  suggestionText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[700] },
  messageList: { paddingVertical: 16, paddingHorizontal: 16 },
  messageWrapper: { marginBottom: 12, maxWidth: '100%' },
  userWrapper: { alignItems: 'flex-end' },
  assistantWrapper: { alignItems: 'flex-start' },
  messageBubble: { borderRadius: 16, padding: 14, maxWidth: '85%' },
  userBubble: { backgroundColor: Colors.primary[500], borderBottomRightRadius: 4 },
  assistantBubble: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1, borderColor: Colors.neutral[200], borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff', fontFamily: 'Inter-Regular' },
  assistantText: { color: Colors.neutral[800], fontFamily: 'Inter-Regular' },
  codeHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral[200],
  },
  codeLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codeLabel: { fontFamily: 'JetBrainsMono-Medium', fontSize: 12, color: Colors.primary[600] },
  copyButton: { padding: 4 },
  codeText: {
    fontFamily: 'JetBrainsMono-Regular', fontSize: 13, lineHeight: 20, color: Colors.neutral[800],
  },
  loadingContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, gap: 8,
  },
  loadingText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[500] },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 16,
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 1, borderTopColor: Colors.neutral[200], gap: 8,
  },
  langButton: {
    backgroundColor: Colors.neutral[100], borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, maxWidth: 80,
  },
  langButtonText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[700] },
  input: {
    flex: 1, backgroundColor: Colors.neutral[100], borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[900],
    maxHeight: 100, minHeight: 44,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,
  sendButtonDisabled: { backgroundColor: Colors.neutral[300] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral[200],
  },
  modalTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: Colors.neutral[900] },
  closeButton: { fontFamily: 'Inter-Medium', fontSize: 16, color: Colors.primary[600] },
  newSessionButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral[200],
  },
  newSessionText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.primary[600] },
  sessionList: { paddingHorizontal: 12 },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginVertical: 2,
  },
  activeSessionItem: { backgroundColor: Colors.primary[50] },
  sessionItemContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sessionTitle: {
    flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[800],
  },
  emptySessionText: {
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[400],
    textAlign: 'center', paddingVertical: 32,
  },
  langPickerContent: {
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%', paddingBottom: 32,
  },
  langList: { paddingHorizontal: 12, paddingVertical: 8 },
  langItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginVertical: 2 },
  langItemSelected: { backgroundColor: Colors.primary[50] },
  langItemText: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.neutral[800] },
});
