import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import type { SharedMedia } from '../../chat/domain/listSharedMedia';
import { useSharedMedia } from '../../chat/hooks/useSharedMedia';
import { formatPresence } from '../../presence/domain/presence';
import { useContactPresence } from '../../presence/hooks/useContactPresence';
import { ContactAvatar } from '../components/ContactAvatar';
import { useBlockStatus } from '../hooks/useBlockStatus';
import type { MainStackParamList } from './MainStackParamList';

type Props = NativeStackScreenProps<MainStackParamList, 'ContactDetail'> & {
  authUser: AuthUser;
};

const GALLERY_COLUMNS = 3;

export function ContactDetailScreen({ navigation, route, authUser }: Props) {
  const theme = useTheme();
  const { contactUid, contactName, contactEmail, contactPhotoURL } = route.params;
  const block = useBlockStatus(authUser.uid, contactUid);
  const presence = formatPresence(useContactPresence(contactUid));
  const media = useSharedMedia(authUser.uid, contactUid);

  function renderMedia({ item }: { item: SharedMedia }) {
    return (
      <View style={styles.tile}>
        <Image
          source={{ uri: item.mediaUrl }}
          style={styles.tileImage}
          resizeMode="cover"
          accessibilityLabel={item.type === 'video' ? 'Shared video' : 'Shared photo'}
        />
        {/* Videos show a frame like photos do, so they need a marker to be
            told apart at thumbnail size. */}
        {item.type === 'video' ? (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={14} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.identity}>
        <ContactAvatar name={contactName} photoURL={contactPhotoURL ?? null} size={96} />
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary, marginTop: 12 }]}>
          {contactName}
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
          {contactEmail}
        </Text>
        {presence && !block.blocked ? (
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
            {presence}
          </Text>
        ) : null}
      </View>

      <View style={styles.mediaHeader}>
        <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
          Shared media
        </Text>
        {media.data ? (
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {media.data.length}
          </Text>
        ) : null}
      </View>

      {media.isPending ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.mediaState} />
      ) : media.data && media.data.length > 0 ? (
        <FlatList
          data={media.data}
          keyExtractor={(item) => item.id}
          renderItem={renderMedia}
          numColumns={GALLERY_COLUMNS}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text
          style={[theme.typography.caption, styles.mediaState, { color: theme.colors.textSecondary }]}
        >
          No photos or videos yet.
        </Text>
      )}

      <Pressable
        style={styles.blockRow}
        onPress={() => block.toggle(contactName)}
        accessibilityLabel={block.blocked ? 'Unblock contact' : 'Block contact'}
      >
        <Ionicons
          name={block.blocked ? 'lock-open-outline' : 'ban-outline'}
          size={20}
          color={theme.colors.error}
        />
        <Text style={[theme.typography.body, { color: theme.colors.error, marginLeft: 10 }]}>
          {block.blocked ? `Unblock ${contactName}` : `Block ${contactName}`}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identity: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mediaState: {
    marginVertical: 20,
    textAlign: 'center',
  },
  tile: {
    flex: 1 / GALLERY_COLUMNS,
    aspectRatio: 1,
    padding: 2,
  },
  tileImage: {
    flex: 1,
    borderRadius: 6,
  },
  videoBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
});
