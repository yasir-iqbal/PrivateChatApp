import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { ContactAvatar } from '../components/ContactAvatar';
import { contactDisplayName, type Contact } from '../domain/contact';
import { useContacts } from '../hooks/useContacts';
import type { MainStackParamList } from './MainStackParamList';

type Props = NativeStackScreenProps<MainStackParamList, 'NewChat'> & {
  authUser: AuthUser;
};

export function NewChatScreen({ navigation, authUser }: Props) {
  const theme = useTheme();
  const { contacts } = useContacts(authUser.uid);

  function openChat(contact: Contact) {
    const name = contactDisplayName(contact);
    // replace, not navigate: backing out of the chat should return to the
    // list the user started from, not this picker.
    navigation.replace('Chat', {
      contactUid: contact.uid,
      contactName: name,
      contactPhotoURL: contact.photoURL,
    });
  }

  function renderContact({ item }: { item: Contact }) {
    const name = contactDisplayName(item);
    return (
      <Pressable
        style={[styles.row, { borderBottomColor: theme.colors.divider }]}
        onPress={() => openChat(item)}
        accessibilityLabel={`Chat with ${name}`}
      >
        <ContactAvatar name={name} photoURL={item.photoURL} />
        <View style={styles.rowText}>
          <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary, marginLeft: theme.spacing.md }]}>
          New chat
        </Text>
      </View>

      {/* Pinned above the list, as WhatsApp does, so adding someone is always
          reachable without scrolling past every contact. */}
      <Pressable
        style={[styles.row, { borderBottomColor: theme.colors.divider }]}
        onPress={() => navigation.navigate('AddContact')}
        accessibilityLabel="New contact"
      >
        <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="person-add" size={20} color={theme.colors.onPrimary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>New contact</Text>
        </View>
      </Pressable>

      {contacts.isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : contacts.data && contacts.data.length > 0 ? (
        <FlatList
          data={contacts.data}
          keyExtractor={(contact) => contact.uid}
          renderItem={renderContact}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
            No contacts yet. Add someone to start chatting.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
