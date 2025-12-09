import React from 'react';
import { StyleSheet } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

export type DateRange = '7d' | '30d' | '90d' | 'all';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  disabled?: boolean;
}

const DATE_RANGE_OPTIONS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  disabled: _disabled = false,
}) => {
  return (
    <SegmentedButtons
      value={value}
      onValueChange={(v) => onChange(v as DateRange)}
      buttons={DATE_RANGE_OPTIONS}
      style={styles.container}
      density="small"
    />
  );
};

export function getDaysFromRange(range: DateRange): number | undefined {
  switch (range) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'all':
      return undefined;
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
});
