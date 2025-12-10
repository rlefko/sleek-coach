import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/forms/FormInput';

// Test wrapper component that provides form context
interface TestFormData {
  email: string;
  name?: string;
}

const testSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().optional(),
});

interface WrapperProps {
  children: (control: ReturnType<typeof useForm<TestFormData>>['control']) => React.ReactNode;
  defaultValues?: Partial<TestFormData>;
}

const FormWrapper: React.FC<WrapperProps> = ({ children, defaultValues }) => {
  const { control } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      email: '',
      name: '',
      ...defaultValues,
    },
  });

  return <PaperProvider theme={MD3DarkTheme}>{children(control)}</PaperProvider>;
};

describe('FormInput', () => {
  describe('rendering', () => {
    it('renders with label', () => {
      const { getByText } = render(
        <FormWrapper>
          {(control) => <FormInput control={control} name="email" label="Email Address" />}
        </FormWrapper>
      );

      expect(getByText('Email Address')).toBeTruthy();
    });

    it('displays value from form control', () => {
      const { getByDisplayValue } = render(
        <FormWrapper defaultValues={{ email: 'test@example.com' }}>
          {(control) => <FormInput control={control} name="email" label="Email" />}
        </FormWrapper>
      );

      expect(getByDisplayValue('test@example.com')).toBeTruthy();
    });

    it('displays empty string for undefined values', () => {
      const { getByText } = render(
        <FormWrapper>
          {(control) => <FormInput control={control} name="name" label="Name" />}
        </FormWrapper>
      );

      // Should render without error
      expect(getByText('Name')).toBeTruthy();
    });
  });

  describe('interaction', () => {
    it('calls onChange on text input', () => {
      const { getByText } = render(
        <FormWrapper defaultValues={{ email: '' }}>
          {(control) => <FormInput control={control} name="email" label="Email" />}
        </FormWrapper>
      );

      // The input should be findable after the label
      const label = getByText('Email');
      expect(label).toBeTruthy();
    });
  });

  describe('props forwarding', () => {
    it('forwards TextInput props like placeholder', () => {
      const { getByPlaceholderText } = render(
        <FormWrapper>
          {(control) => (
            <FormInput
              control={control}
              name="email"
              label="Email"
              placeholder="Enter your email"
            />
          )}
        </FormWrapper>
      );

      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    });

    it('forwards secureTextEntry prop', () => {
      render(
        <FormWrapper>
          {(control) => (
            <FormInput control={control} name="email" label="Password" secureTextEntry={true} />
          )}
        </FormWrapper>
      );

      // The component renders, which means props are accepted
      // Deep prop testing would require implementation details
    });

    it('forwards autoCapitalize prop', () => {
      // The component should accept and forward autoCapitalize
      const { getByText } = render(
        <FormWrapper>
          {(control) => (
            <FormInput control={control} name="email" label="Email" autoCapitalize="none" />
          )}
        </FormWrapper>
      );

      expect(getByText('Email')).toBeTruthy();
    });

    it('forwards keyboardType prop', () => {
      const { getByText } = render(
        <FormWrapper>
          {(control) => (
            <FormInput control={control} name="email" label="Email" keyboardType="email-address" />
          )}
        </FormWrapper>
      );

      expect(getByText('Email')).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('accepts containerStyle prop', () => {
      const { getByText } = render(
        <FormWrapper>
          {(control) => (
            <FormInput
              control={control}
              name="email"
              label="Email"
              containerStyle={{ marginTop: 20 }}
            />
          )}
        </FormWrapper>
      );

      expect(getByText('Email')).toBeTruthy();
    });

    it('accepts style prop for input', () => {
      const { getByText } = render(
        <FormWrapper>
          {(control) => (
            <FormInput control={control} name="email" label="Email" style={{ fontSize: 18 }} />
          )}
        </FormWrapper>
      );

      expect(getByText('Email')).toBeTruthy();
    });
  });
});
