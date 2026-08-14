import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { ContactAvatar } from '../../contacts/components/ContactAvatar';
import type { MainStackParamList } from '../../contacts/screens/MainStackParamList';
import { MessageBubble } from '../components/MessageBubble';
import type { Message } from '../domain/message';
import { messageStatusFor } from '../domain/messageStatus';
import { useConversationMeta } from '../hooks/useConversationMeta';
import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'> & {
  authUser: AuthUser;
};

export function ChatScreen({ navigation, route, authUser }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { contactUid, contactName, contactPhotoURL } = route.params;
  const { messages, loading, error } = useMessages(authUser.uid, contactUid);
  const { otherDeliveredAt, otherSeenAt } = useConversationMeta(authUser.uid, contactUid, messages);
  const { draft, setDraft, send, canSend, error: sendError } = useSendMessage(authUser.uid, contactUid);

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.senderId === authUser.uid;
    return (
      <MessageBubble
        message={item}
        isMine={isMine}
        status={messageStatusFor(item, otherDeliveredAt, otherSeenAt)}
      />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.chatBackground }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, paddingTop: insets.top + 8, borderBottomColor: theme.colors.divider },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.headerAvatar}>
          <ContactAvatar name={contactName} photoURL={contactPhotoURL ?? null} size={38} />
        </View>
        <Text
          style={[theme.typography.body, styles.headerName, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {contactName}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={[theme.typography.body, { color: theme.colors.error, textAlign: 'center' }]}>
              {error.message}
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centered}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
              No messages yet. Say hello.
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(message) => message.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {sendError ? (
          <Text style={[theme.typography.caption, styles.sendError, { color: theme.colors.error }]}>
            {sendError.message}
          </Text>
        ) : null}

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            style={[
              theme.typography.body,
              styles.input,
              { color: theme.colors.textPrimary, backgroundColor: theme.colors.surface },
            ]}
            testID="chat-input"
          />
          <Pressable
            onPress={send}
            disabled={!canSend}
            hitSlop={8}
            accessibilityLabel="Send message"
            style={[styles.sendButton, { backgroundColor: theme.colors.primary, opacity: canSend ? 1 : 0.5 }]}
          >
            <Ionicons name="send" size={20} color={theme.colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerAvatar: {
    marginLeft: 12,
  },
  headerName: {
    flex: 1,
    marginLeft: 10,
    fontWeight: '600',
  },
  list: {
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sendError: {
    marginHorizontal: 12,
    marginBottom: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
