import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

type RootStackParamList = {
  Placeholder: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Temporary screen so the navigator has a route to render. Replace with the
// first real feature's entry screen.
function PlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text>Scaffold OK</Text>
    </View>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Placeholder" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
