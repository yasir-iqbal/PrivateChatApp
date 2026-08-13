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

import { ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import type { MainStackParamList } from '../../contacts/screens/MainStackParamList';
import type { Message } from '../domain/message';
import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'> & {
  authUser: AuthUser;
};

export function ChatScreen({ navigation, route, authUser }: Props) {
  const theme = useTheme();
  const { contactUid, contactName } = route.params;
  const { messages, loading, error } = useMessages(authUser.uid, contactUid);
  const { draft, setDraft, send, canSend, error: sendError } = useSendMessage(authUser.uid, contactUid);

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.senderId === authUser.uid;
    return (
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          {
            backgroundColor: isMine ? theme.colors.bubbleOutgoing : theme.colors.bubbleIncoming,
            opacity: item.pending ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            theme.typography.body,
            { color: isMine ? theme.colors.bubbleOutgoingText : theme.colors.bubbleIncomingText },
          ]}
        >
          {item.text}
        </Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text
          style={[theme.typography.title, { color: theme.colors.textPrimary, marginLeft: theme.spacing.md }]}
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
          <Text style={[theme.typography.caption, { color: theme.colors.error, marginBottom: theme.spacing.xs }]}>
            {sendError.message}
          </Text>
        ) : null}

        <View style={[styles.composer, { borderTopColor: theme.colors.divider }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            style={[
              theme.typography.body,
              styles.input,
              {
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            testID="chat-input"
          />
          <Pressable
            onPress={send}
            disabled={!canSend}
            hitSlop={8}
            accessibilityLabel="Send message"
            style={[styles.sendButton, { backgroundColor: theme.colors.primary, opacity: canSend ? 1 : 0.4 }]}
          >
            <Ionicons name="send" size={18} color={theme.colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  list: {
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 3,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
