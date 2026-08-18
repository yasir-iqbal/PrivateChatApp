import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { ContactAvatar } from '../../contacts/components/ContactAvatar';
import { useNotificationNavigation } from '../../notifications/hooks/useNotificationNavigation';
import type { MainStackParamList } from '../../contacts/screens/MainStackParamList';
import { useConversations, type ConversationRow } from '../hooks/useConversations';
import { useDeliveryReporter } from '../hooks/useDeliveryReporter';

type Props = NativeStackScreenProps<MainStackParamList, 'Chats'> & {
  authUser: AuthUser;
};

// Today's messages show a time, older ones a date — the chat-list convention.
function formatWhen(millis: number | null): string {
  if (millis === null) return '';
  const date = new Date(millis);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  return sameDay
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function rowName(row: ConversationRow): string {
  return row.profile?.displayName?.trim() || row.profile?.email || 'Unknown';
}

export function ChatsScreen({ navigation, authUser }: Props) {
  const theme = useTheme();
  const { conversations, loading, error } = useConversations(authUser.uid);
  // The list is open whenever the app is, which is what lets delivery be
  // reported before the recipient opens the conversation.
  useDeliveryReporter(authUser.uid, conversations);
  // Lives on the stack root, which stays mounted, so a tapped notification
  // opens the conversation whichever screen the app was showing.
  useNotificationNavigation(true, (target) =>
    navigation.navigate('Chat', { contactUid: target.contactUid, contactName: target.contactName }),
  );

  function renderRow({ item }: { item: ConversationRow }) {
    const name = rowName(item);
    return (
      <Pressable
        style={[styles.row, { borderBottomColor: theme.colors.divider }]}
        onPress={() =>
          navigation.navigate('Chat', {
            contactUid: item.otherUid,
            contactName: name,
            contactPhotoURL: item.profile?.photoURL ?? null,
          })
        }
        accessibilityLabel={`Chat with ${name}`}
      >
        <ContactAvatar name={name} photoURL={item.profile?.photoURL ?? null} />
        <View style={styles.rowText}>
          <View style={styles.rowTop}>
            <Text
              style={[theme.typography.body, styles.rowName, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {formatWhen(item.lastMessageAt)}
            </Text>
          </View>
          <Text
            style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.lastMessageText ?? 'No messages yet'}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>Chats</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate('Contacts')}
            hitSlop={8}
            accessibilityLabel="Contacts"
          >
            <Ionicons name="people-outline" size={22} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={8}
            accessibilityLabel="Settings"
            style={{ marginLeft: theme.spacing.md }}
          >
            <Ionicons name="settings-outline" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>

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
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(row) => row.id}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centered}>
          <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.icon} />
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.md },
            ]}
          >
            No chats yet. Tap the button below to start one.
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => navigation.navigate('NewChat')}
        accessibilityLabel="New chat"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      >
        <Ionicons name="chatbubble" size={24} color={theme.colors.onPrimary} />
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowName: {
    flex: 1,
    fontWeight: '600',
    marginRight: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
