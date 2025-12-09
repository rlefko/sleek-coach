import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Chip, Text } from 'react-native-paper';
import { useAppTheme, spacing } from '@/theme';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label: string;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Type and press Enter to add',
}) => {
  const { theme } = useAppTheme();
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmitEditing = () => {
    handleAddTag();
  };

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
      <TextInput
        mode="outlined"
        value={inputValue}
        onChangeText={setInputValue}
        onSubmitEditing={handleSubmitEditing}
        placeholder={placeholder}
        returnKeyType="done"
        style={styles.input}
        right={
          inputValue.trim() ? <TextInput.Icon icon="plus" onPress={handleAddTag} /> : undefined
        }
      />
      {value.length > 0 && (
        <View style={styles.tagsContainer}>
          {value.map((tag) => (
            <Chip key={tag} onClose={() => handleRemoveTag(tag)} style={styles.chip} compact>
              {tag}
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: 'transparent',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
});
