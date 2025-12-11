import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { MarkdownContent } from '@/components/coach/MarkdownContent';

// Wrap component with PaperProvider for testing
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>);
};

describe('MarkdownContent', () => {
  const defaultProps = {
    content: 'Test content',
    textColor: '#FFFFFF',
  };

  describe('basic rendering', () => {
    it('renders plain text', () => {
      const { getByText } = renderWithProvider(<MarkdownContent {...defaultProps} />);

      expect(getByText('Test content')).toBeTruthy();
    });

    it('returns null for empty content when not streaming', () => {
      const { toJSON } = renderWithProvider(
        <MarkdownContent content="" textColor="#FFFFFF" isStreaming={false} />
      );

      expect(toJSON()).toBeNull();
    });

    it('returns null for null content when not streaming', () => {
      const { toJSON } = renderWithProvider(
        <MarkdownContent content={null} textColor="#FFFFFF" isStreaming={false} />
      );

      expect(toJSON()).toBeNull();
    });

    it('returns null for undefined content when not streaming', () => {
      const { toJSON } = renderWithProvider(
        <MarkdownContent content={undefined} textColor="#FFFFFF" isStreaming={false} />
      );

      expect(toJSON()).toBeNull();
    });
  });

  describe('streaming state', () => {
    it('shows ellipsis when streaming with empty content', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="" textColor="#FFFFFF" isStreaming={true} />
      );

      expect(getByText('...')).toBeTruthy();
    });

    it('shows ellipsis when streaming with null content', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content={null} textColor="#FFFFFF" isStreaming={true} />
      );

      expect(getByText('...')).toBeTruthy();
    });

    it('renders content when streaming with non-empty content', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="Partial response" textColor="#FFFFFF" isStreaming={true} />
      );

      expect(getByText('Partial response')).toBeTruthy();
    });
  });

  describe('markdown formatting', () => {
    it('renders bold text', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="This is **bold** text" textColor="#FFFFFF" />
      );

      expect(getByText(/bold/)).toBeTruthy();
    });

    it('renders italic text', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="This is *italic* text" textColor="#FFFFFF" />
      );

      expect(getByText(/italic/)).toBeTruthy();
    });

    it('renders headers', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="# Header 1" textColor="#FFFFFF" />
      );

      expect(getByText('Header 1')).toBeTruthy();
    });

    it('renders lists', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="- Item 1\n- Item 2\n- Item 3" textColor="#FFFFFF" />
      );

      expect(getByText(/Item 1/)).toBeTruthy();
      expect(getByText(/Item 2/)).toBeTruthy();
      expect(getByText(/Item 3/)).toBeTruthy();
    });

    it('renders ordered lists', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="1. First\n2. Second\n3. Third" textColor="#FFFFFF" />
      );

      expect(getByText(/First/)).toBeTruthy();
      expect(getByText(/Second/)).toBeTruthy();
      expect(getByText(/Third/)).toBeTruthy();
    });

    it('renders inline code', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="Use the `useState` hook" textColor="#FFFFFF" />
      );

      expect(getByText(/useState/)).toBeTruthy();
    });

    it('renders code blocks', () => {
      const content = '```\nconst x = 1;\n```';
      const { getByText } = renderWithProvider(
        <MarkdownContent content={content} textColor="#FFFFFF" />
      );

      expect(getByText(/const x = 1/)).toBeTruthy();
    });

    it('renders links', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="Check [this link](https://example.com)" textColor="#FFFFFF" />
      );

      expect(getByText(/this link/)).toBeTruthy();
    });

    it('renders blockquotes', () => {
      const { getByText } = renderWithProvider(
        <MarkdownContent content="> This is a quote" textColor="#FFFFFF" />
      );

      expect(getByText(/This is a quote/)).toBeTruthy();
    });
  });

  describe('partial markdown handling', () => {
    it('handles incomplete bold syntax', () => {
      // Incomplete bold should render without crashing
      const { getByText } = renderWithProvider(
        <MarkdownContent content="This is **incomplete" textColor="#FFFFFF" />
      );

      expect(getByText(/incomplete/)).toBeTruthy();
    });

    it('handles incomplete code block without crashing', () => {
      // Incomplete code block should render without crashing
      // The library may handle incomplete blocks differently (as plain text or code)
      const { toJSON } = renderWithProvider(
        <MarkdownContent content="```\nconst x" textColor="#FFFFFF" />
      );

      // Just verify it renders without crashing
      expect(toJSON()).not.toBeNull();
    });
  });
});
