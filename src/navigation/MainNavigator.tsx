import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { User } from '@react-native-firebase/auth';

import type { AuthUser } from '../features/auth/domain/authUser';
import { ChatScreen } from '../features/chat/screens/ChatScreen';
import { ChatsScreen } from '../features/chat/screens/ChatsScreen';
import { AddContactScreen } from '../features/contacts/screens/AddContactScreen';
import { ContactsScreen } from '../features/contacts/screens/ContactsScreen';
import { ContactDetailScreen } from '../features/contacts/screens/ContactDetailScreen';
import { NewChatScreen } from '../features/contacts/screens/NewChatScreen';
import { SettingsScreen } from '../features/profile/screens/SettingsScreen';
import type { MainStackParamList } from '../features/contacts/screens/MainStackParamList';

const Stack = createNativeStackNavigator<MainStackParamList>();

type Props = {
  authUser: AuthUser;
  firebaseUser: User;
  refreshAuthState: () => Promise<void>;
};

export function MainNavigator({ authUser, firebaseUser, refreshAuthState }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Chats">
        {(props) => <ChatsScreen {...props} authUser={authUser} />}
      </Stack.Screen>
      <Stack.Screen name="Contacts">
        {(props) => <ContactsScreen {...props} authUser={authUser} />}
      </Stack.Screen>
      <Stack.Screen name="NewChat">
        {(props) => <NewChatScreen {...props} authUser={authUser} />}
      </Stack.Screen>
      <Stack.Screen name="AddContact">
        {(props) => <AddContactScreen {...props} authUser={authUser} />}
      </Stack.Screen>
      <Stack.Screen name="Settings">
        {(props) => (
          <SettingsScreen
            {...props}
            authUser={authUser}
            firebaseUser={firebaseUser}
            refreshAuthState={refreshAuthState}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ContactDetail">
        {(props) => <ContactDetailScreen {...props} authUser={authUser} />}
      </Stack.Screen>
      <Stack.Screen name="Chat">
        {(props) => <ChatScreen {...props} authUser={authUser} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
