import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme, spacing } from '@/theme';
import { useLatestCheckin, useCreateCheckin, useUploadPhoto } from '@/services/hooks';
import { useUIStore } from '@/stores/uiStore';
import { useSyncStore } from '@/stores/syncStore';
import { WeightInput, MetricSlider, PhotoPicker, type PhotoItem } from '@/components/checkin';
import { checkinSchema, type CheckinFormData, toCheckInCreate } from '@/schemas/checkinSchemas';
import { Card, CardContent } from '@/components/ui';

function formatToday(): string {
  return new Date().toISOString().split('T')[0];
}

export const CheckInScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const unitSystem = useUIStore((s) => s.unitSystem);
  const unit = unitSystem === 'imperial' ? 'lbs' : 'kg';

  const { data: latestCheckin } = useLatestCheckin();
  const createCheckin = useCreateCheckin();
  const uploadPhoto = useUploadPhoto();
  const addPendingCheckin = useSyncStore((s) => s.addPendingCheckin);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showOptionalMetrics, setShowOptionalMetrics] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      date: formatToday(),
      weight_kg: undefined,
      notes: '',
      energy_level: undefined,
      sleep_quality: undefined,
      mood: undefined,
    },
  });

  const handleAddPhoto = useCallback((photo: PhotoItem) => {
    setPhotos((prev) => [...prev, photo]);
  }, []);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = async (data: CheckinFormData) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

      const checkinData = toCheckInCreate(data);

      if (isOnline) {
        // Upload photos first
        for (const photo of photos) {
          try {
            await uploadPhoto.mutateAsync({
              imageUri: photo.uri,
              filename: photo.filename,
              contentType: photo.type,
              date: data.date,
            });
          } catch {
            console.warn('Photo upload failed, continuing...');
          }
        }

        // Create check-in
        await createCheckin.mutateAsync(checkinData);
        setSnackbarMessage('Check-in saved!');
      } else {
        // Queue for offline sync
        addPendingCheckin(checkinData);
        setSnackbarMessage('Saved offline. Will sync when online.');
      }

      setSnackbarVisible(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch {
      Alert.alert('Error', 'Failed to save check-in. Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            Daily Check-in
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.lg }}
          >
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {/* Weight Input */}
          <Card variant="elevated">
            <CardContent>
              <Controller
                control={control}
                name="weight_kg"
                render={({ field: { onChange, value } }) => (
                  <WeightInput
                    value={value}
                    onChange={onChange}
                    unit={unit}
                    onUnitChange={() => {}}
                    lastWeight={latestCheckin?.weight_kg ?? undefined}
                  />
                )}
              />
              {errors.weight_kg && (
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                  {errors.weight_kg.message}
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card variant="outlined" style={{ marginTop: spacing.md }}>
            <CardContent>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface, marginBottom: spacing.sm }}
              >
                Notes (Optional)
              </Text>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    mode="outlined"
                    placeholder="How are you feeling today?"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                    style={styles.notesInput}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Optional Metrics Toggle */}
          <Button
            mode="text"
            onPress={() => setShowOptionalMetrics(!showOptionalMetrics)}
            icon={showOptionalMetrics ? 'chevron-up' : 'chevron-down'}
            contentStyle={styles.toggleButton}
          >
            {showOptionalMetrics ? 'Hide' : 'Show'} wellness metrics
          </Button>

          {/* Optional Metrics */}
          {showOptionalMetrics && (
            <Card variant="outlined">
              <CardContent>
                <Controller
                  control={control}
                  name="energy_level"
                  render={({ field: { onChange, value } }) => (
                    <MetricSlider type="energy" value={value} onChange={onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name="sleep_quality"
                  render={({ field: { onChange, value } }) => (
                    <MetricSlider type="sleep" value={value} onChange={onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name="mood"
                  render={({ field: { onChange, value } }) => (
                    <MetricSlider type="mood" value={value} onChange={onChange} />
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          <Card variant="outlined" style={{ marginTop: spacing.md }}>
            <CardContent>
              <PhotoPicker
                photos={photos}
                onAdd={handleAddPhoto}
                onRemove={handleRemovePhoto}
                maxPhotos={4}
              />
            </CardContent>
          </Card>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || createCheckin.isPending}
            disabled={isSubmitting || createCheckin.isPending}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            Save Check-in
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  notesInput: {
    minHeight: 80,
  },
  toggleButton: {
    flexDirection: 'row-reverse',
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    borderRadius: 12,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
});
