import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { useSignOut } from '../../auth/hooks/useSignOut';
import { ContactAvatar } from '../components/ContactAvatar';
import { contactDisplayName, type Contact } from '../domain/contact';
import { useContacts } from '../hooks/useContacts';
import type { MainStackParamList } from './MainStackParamList';

type Props = NativeStackScreenProps<MainStackParamList, 'Contacts'> & {
  authUser: AuthUser;
};

export function ContactsScreen({ navigation, authUser }: Props) {
  const theme = useTheme();
  const { contacts, remove } = useContacts(authUser.uid);
  const signOut = useSignOut();

  function confirmRemove(contact: Contact) {
    Alert.alert(
      'Remove contact',
      `Remove ${contactDisplayName(contact)} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(contact.uid) },
      ],
    );
  }

  function renderContact({ item }: { item: Contact }) {
    const name = contactDisplayName(item);
    return (
      <View style={[styles.row, { borderBottomColor: theme.colors.divider }]}>
        <Pressable
          style={styles.rowMain}
          onPress={() => navigation.navigate('Chat', { contactUid: item.uid, contactName: name })}
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
        <Pressable
          onPress={() => confirmRemove(item)}
          hitSlop={8}
          accessibilityLabel={`Remove ${name}`}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>Contacts</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate('AddContact')}
            hitSlop={8}
            accessibilityLabel="Add contact"
          >
            <Ionicons name="person-add-outline" size={22} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => signOut.mutate()}
            hitSlop={8}
            accessibilityLabel="Sign out"
            style={{ marginLeft: theme.spacing.md }}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {contacts.isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : contacts.error ? (
        <View style={styles.centered}>
          <Text style={[theme.typography.body, { color: theme.colors.error, textAlign: 'center' }]}>
            {(contacts.error as Error).message}
          </Text>
          <Button label="Try again" variant="text" onPress={() => contacts.refetch()} />
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
          <Ionicons name="people-outline" size={48} color={theme.colors.icon} />
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.md },
            ]}
          >
            No contacts yet. Add someone by their email address to start chatting.
          </Text>
          <Button
            label="Add contact"
            onPress={() => navigation.navigate('AddContact')}
            style={{ marginTop: theme.spacing.lg, alignSelf: 'stretch' }}
          />
        </View>
      )}
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
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
