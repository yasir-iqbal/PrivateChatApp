import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthUser } from '../features/auth/domain/authUser';
import { AddContactScreen } from '../features/contacts/screens/AddContactScreen';
import { ContactsScreen } from '../features/contacts/screens/ContactsScreen';
import type { MainStackParamList } from '../features/contacts/screens/MainStackParamList';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator({ authUser }: { authUser: AuthUser }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Contacts">
        {(props) => <ContactsScreen {...props} authUser={authUser} />}
      </Stack.Screen>
      <Stack.Screen name="AddContact">
        {(props) => <AddContactScreen {...props} authUser={authUser} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
