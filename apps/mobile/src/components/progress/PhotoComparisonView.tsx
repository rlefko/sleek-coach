import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import { Text, useTheme, IconButton, Menu, Button } from 'react-native-paper';
import { spacing } from '@/theme';
import type { PhotoWithDownloadUrl } from '@/services/api/photoService';

interface PhotoComparisonViewProps {
  photos: PhotoWithDownloadUrl[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;
const PHOTO_HEIGHT = (PHOTO_WIDTH * 4) / 3;

export const PhotoComparisonView: React.FC<PhotoComparisonViewProps> = ({ photos }) => {
  const theme = useTheme();
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(photos.length > 1 ? photos.length - 1 : 0);
  const [leftMenuVisible, setLeftMenuVisible] = useState(false);
  const [rightMenuVisible, setRightMenuVisible] = useState(false);

  if (photos.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <IconButton icon="image-multiple" size={48} iconColor={theme.colors.onSurfaceVariant} />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          No photos yet
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
        >
          Add progress photos during check-ins to compare your journey
        </Text>
      </View>
    );
  }

  if (photos.length === 1) {
    return (
      <View style={styles.singlePhotoContainer}>
        <Text
          variant="titleMedium"
          style={{ color: theme.colors.onSurface, marginBottom: spacing.md }}
        >
          Progress Photos
        </Text>
        <Image
          source={{ uri: photos[0].download_url }}
          style={[styles.singlePhoto, { backgroundColor: theme.colors.surfaceVariant }]}
          resizeMode="cover"
        />
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.sm }}
        >
          {new Date(photos[0].date).toLocaleDateString()}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }}
        >
          Add more photos to enable comparison
        </Text>
      </View>
    );
  }

  const leftPhoto = photos[leftIndex];
  const rightPhoto = photos[rightIndex];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text
        variant="titleMedium"
        style={{ color: theme.colors.onSurface, marginBottom: spacing.md }}
      >
        Compare Progress
      </Text>

      <View style={styles.comparisonRow}>
        {/* Left Photo */}
        <View style={styles.photoColumn}>
          <Menu
            visible={leftMenuVisible}
            onDismiss={() => setLeftMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                onPress={() => setLeftMenuVisible(true)}
                style={styles.dateButton}
              >
                {formatDate(leftPhoto.date)}
              </Button>
            }
          >
            <ScrollView style={styles.menuScroll}>
              {photos.map((photo, index) => (
                <Menu.Item
                  key={photo.id}
                  onPress={() => {
                    setLeftIndex(index);
                    setLeftMenuVisible(false);
                  }}
                  title={formatDate(photo.date)}
                  leadingIcon={index === leftIndex ? 'check' : undefined}
                />
              ))}
            </ScrollView>
          </Menu>
          <Image
            source={{ uri: leftPhoto.download_url }}
            style={[styles.photo, { backgroundColor: theme.colors.surfaceVariant }]}
            resizeMode="cover"
          />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Before
          </Text>
        </View>

        {/* Right Photo */}
        <View style={styles.photoColumn}>
          <Menu
            visible={rightMenuVisible}
            onDismiss={() => setRightMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                onPress={() => setRightMenuVisible(true)}
                style={styles.dateButton}
              >
                {formatDate(rightPhoto.date)}
              </Button>
            }
          >
            <ScrollView style={styles.menuScroll}>
              {photos.map((photo, index) => (
                <Menu.Item
                  key={photo.id}
                  onPress={() => {
                    setRightIndex(index);
                    setRightMenuVisible(false);
                  }}
                  title={formatDate(photo.date)}
                  leadingIcon={index === rightIndex ? 'check' : undefined}
                />
              ))}
            </ScrollView>
          </Menu>
          <Image
            source={{ uri: rightPhoto.download_url }}
            style={[styles.photo, { backgroundColor: theme.colors.surfaceVariant }]}
            resizeMode="cover"
          />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            After
          </Text>
        </View>
      </View>

      {/* Time between photos */}
      <Text
        variant="bodySmall"
        style={[styles.timeBetween, { color: theme.colors.onSurfaceVariant }]}
      >
        {calculateDaysBetween(leftPhoto.date, rightPhoto.date)} days between photos
      </Text>
    </View>
  );
};

function calculateDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    height: PHOTO_HEIGHT + 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  singlePhotoContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  singlePhoto: {
    width: PHOTO_WIDTH * 1.5,
    height: PHOTO_HEIGHT * 1.5,
    borderRadius: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  photoColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dateButton: {
    marginBottom: spacing.sm,
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: 12,
  },
  menuScroll: {
    maxHeight: 200,
  },
  timeBetween: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
