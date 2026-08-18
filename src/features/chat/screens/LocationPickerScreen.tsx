import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import type { MainStackParamList } from '../../contacts/screens/MainStackParamList';
import { describeLocation, readCurrentLocation, type PickedLocation } from '../domain/pickLocation';
import { useSendAttachment } from '../hooks/useSendAttachment';

type Props = NativeStackScreenProps<MainStackParamList, 'LocationPicker'> & {
  authUser: AuthUser;
};

// Tight enough to recognise a street, wide enough to see where you are.
const DELTA = 0.005;

export function LocationPickerScreen({ navigation, route, authUser }: Props) {
  const theme = useTheme();
  const { contactUid } = route.params;
  const attachment = useSendAttachment(authUser.uid, contactUid);

  const [region, setRegion] = useState<Region | null>(null);
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    readCurrentLocation()
      .then((location) => {
        if (cancelled) return;
        setPicked(location);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        });
      })
      .catch((locationError) => {
        if (!cancelled) setError(locationError as Error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dragging the pin picks somewhere other than where you are, which is the
  // point of a picker rather than sending immediately.
  function moveTo(latitude: number, longitude: number) {
    setPicked({ latitude, longitude, address: null });
    describeLocation({ latitude, longitude })
      .then((address) => setPicked({ latitude, longitude, address }))
      .catch(() => {
        // Keeps the coordinates; only the description is missing.
      });
  }

  function send() {
    if (!picked) return;
    attachment.sendLocation(picked.latitude, picked.longitude, picked.address);
    navigation.goBack();
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary, marginLeft: theme.spacing.md }]}>
          Send location
        </Text>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={[theme.typography.body, { color: theme.colors.error, textAlign: 'center' }]}>
            {error.message}
          </Text>
        </View>
      ) : region === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            Finding your location…
          </Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton
            onPress={(event) =>
              moveTo(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude)
            }
            testID="location-map"
          >
            {picked ? (
              <Marker
                draggable
                coordinate={{ latitude: picked.latitude, longitude: picked.longitude }}
                onDragEnd={(event) =>
                  moveTo(
                    event.nativeEvent.coordinate.latitude,
                    event.nativeEvent.coordinate.longitude,
                  )
                }
              />
            ) : null}
          </MapView>

          <Pressable
            style={[styles.sendRow, { borderTopColor: theme.colors.divider }]}
            onPress={send}
            disabled={!picked || attachment.isSending}
            accessibilityLabel="Send this location"
          >
            <View style={[styles.sendIcon, { backgroundColor: theme.colors.primary }]}>
              {attachment.isSending ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Ionicons name="location" size={20} color={theme.colors.onPrimary} />
              )}
            </View>
            <View style={styles.sendText}>
              <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
                Send this location
              </Text>
              <Text
                style={[theme.typography.caption, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {picked?.address ??
                  (picked ? `${picked.latitude.toFixed(5)}, ${picked.longitude.toFixed(5)}` : '')}
              </Text>
            </View>
          </Pressable>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sendIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    flex: 1,
    marginLeft: 12,
  },
});
