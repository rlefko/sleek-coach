import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { Text, useTheme, IconButton, Portal, Modal, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { spacing, borderRadius } from '@/theme';

export interface PhotoItem {
  uri: string;
  filename: string;
  type: string;
}

interface PhotoPickerProps {
  photos: PhotoItem[];
  onAdd: (photo: PhotoItem) => void;
  onRemove: (index: number) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  photos,
  onAdd,
  onRemove,
  maxPhotos = 4,
  disabled = false,
}) => {
  const theme = useTheme();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const canAddMore = photos.length < maxPhotos && !disabled;

  const handleCameraPress = async () => {
    setShowPicker(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.fileName || `photo_${Date.now()}.jpg`;
      onAdd({
        uri: asset.uri,
        filename,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleGalleryPress = async () => {
    setShowPicker(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.fileName || `photo_${Date.now()}.jpg`;
      onAdd({
        uri: asset.uri,
        filename,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleRemove = (index: number) => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(index) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text
        variant="titleSmall"
        style={{ color: theme.colors.onSurface, marginBottom: spacing.sm }}
      >
        Progress Photos (Optional)
      </Text>

      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <Pressable
            key={photo.uri}
            onPress={() => setPreviewUri(photo.uri)}
            style={[styles.photoContainer, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <IconButton
              icon="close-circle"
              size={20}
              iconColor={theme.colors.error}
              style={styles.removeButton}
              onPress={() => handleRemove(index)}
            />
          </Pressable>
        ))}

        {canAddMore && (
          <Pressable
            onPress={() => setShowPicker(true)}
            style={[
              styles.addButton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <IconButton icon="camera-plus" size={32} iconColor={theme.colors.onSurfaceVariant} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Add Photo
            </Text>
          </Pressable>
        )}
      </View>

      <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
        {photos.length}/{maxPhotos} photos
      </Text>

      {/* Source picker modal */}
      <Portal>
        <Modal
          visible={showPicker}
          onDismiss={() => setShowPicker(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={{ marginBottom: spacing.md }}>
            Add Photo
          </Text>
          <Button
            icon="camera"
            mode="contained"
            onPress={handleCameraPress}
            style={styles.modalButton}
          >
            Take Photo
          </Button>
          <Button
            icon="image"
            mode="contained-tonal"
            onPress={handleGalleryPress}
            style={styles.modalButton}
          >
            Choose from Gallery
          </Button>
          <Button mode="text" onPress={() => setShowPicker(false)}>
            Cancel
          </Button>
        </Modal>
      </Portal>

      {/* Preview modal */}
      <Portal>
        <Modal
          visible={!!previewUri}
          onDismiss={() => setPreviewUri(null)}
          contentContainerStyle={styles.previewModal}
        >
          {previewUri && (
            <>
              <Image
                source={{ uri: previewUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <IconButton
                icon="close"
                iconColor="white"
                size={28}
                style={styles.closePreview}
                onPress={() => setPreviewUri(null)}
              />
            </>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    width: 100,
    height: 133,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  addButton: {
    width: 100,
    height: 133,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  modal: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  modalButton: {
    marginBottom: spacing.sm,
  },
  previewModal: {
    flex: 1,
    margin: 0,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  closePreview: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
