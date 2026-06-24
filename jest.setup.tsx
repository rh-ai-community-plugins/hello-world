import React from 'react';
import { act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Patch jest.advanceTimersByTime to wrap timer execution in act() for proper React state update handling
const originalAdvanceTimersByTime = jest.advanceTimersByTime.bind(jest);
Object.defineProperty(jest, 'advanceTimersByTime', {
  configurable: true,
  value: (ms: number) => {
    act(() => {
      originalAdvanceTimersByTime(ms);
    });
  },
});

// Global TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

// Mock React Router DOM
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
    useLocation: () => ({
      pathname: '/',
      search: '',
      state: undefined,
    }),
    Outlet: () => null,
    // Mock Routes and Route so App component can render without Router context errors
    // Only render the first route to avoid duplicate elements
    Routes: ({ children }: { children: React.ReactNode }) => {
      const childrenArray = Array.isArray(children) ? children : [children];
      const firstChild = childrenArray[0] as React.ReactElement;
      return <div data-testid="routes">{firstChild}</div>;
    },
    Route: ({ element }: { element: React.ReactNode }) => element,
  };
});

// Mock PatternFly components that may not render well in test environment
jest.mock('@patternfly/react-core', () => {
  const actual = jest.requireActual('@patternfly/react-core');
  return {
    ...actual,
    TextVariants: actual.TextVariants || {
      p: 'p',
      small: 'small',
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      code: 'code',
      pre: 'pre',
    },
    AlertVariant: actual.AlertVariant || {
      success: 'success',
      danger: 'danger',
      warning: 'warning',
      info: 'info',
      light: 'light',
    },
    Bullseye: ({ children }: { children: React.ReactNode }) => <div data-testid="bullseye">{children}</div>,
    Page: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="page" className={className}>{children}</div>
    ),
    PageSection: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
      <section data-testid="page-section" variant={variant} className={className}>{children}</section>
    ),
    Stack: ({ children }: { children: React.ReactNode }) => <div data-testid="stack">{children}</div>,
    StackItem: ({ children }: { children: React.ReactNode }) => <div data-testid="stack-item">{children}</div>,
    Flex: ({ children, justifyContent, display }: { children: React.ReactNode; justifyContent?: Record<string, string>; display?: Record<string, string> }) => (
      <div data-testid="flex">{children}</div>
    ),
    FlexItem: ({ children }: { children: React.ReactNode }) => <div data-testid="flex-item">{children}</div>,
    TextContent: ({ children }: { children: React.ReactNode }) => <div data-testid="text-content">{children}</div>,
    Text: ({ children, component, componentProps, className }: { children: React.ReactNode; component?: string; componentProps?: Record<string, unknown>; className?: string }) => {
      const Tag = component || 'span';
      // Flatten children to extract text content for better regex matching across nested elements
      const flattenText = (node: React.ReactNode): string => {
        if (typeof node === 'string' || typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(flattenText).join('');
        if (React.isValidElement(node)) return flattenText(node.props.children);
        return '';
      };
      const textContent = flattenText(children);
      return <Tag data-testid="text" className={className}>{textContent}</Tag>;
    },
    // Fragment to flatten children for better text matching
    Fragment: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Title: ({ children, headingLevel, size }: { children: React.ReactNode; headingLevel?: string; size?: string }) => {
      const Tag = headingLevel || 'h1';
      return <Tag data-testid="title" size={size}>{children}</Tag>;
    },
    Button: ({ children, variant, icon, onClick, className }: { children: React.ReactNode; variant?: string; icon?: React.ReactNode; onClick?: () => void; className?: string }) => (
      <button data-testid="button" variant={variant} onClick={onClick} className={className}>{icon}{children}</button>
    ),
    Alert: ({ children, variant, title, isVisible, onClose }: { children: React.ReactNode; variant?: string; title?: string; isVisible?: boolean; onClose?: () => void }) => {
      // Always render when isVisible is true, use display:none for hidden state to maintain DOM presence
      if (!isVisible) return null;
      return <div data-testid="alert" variant={variant} onClick={onClose}><div data-testid="alert-title">{title}</div>{children}</div>;
    },
  };
});

// Mock PatternFly icons
jest.mock('@patternfly/react-icons', () => ({
  TerminalIcon: () => <svg data-testid="terminal-icon" />,
  CheckCircleIcon: () => <svg data-testid="check-circle-icon" />,
}));
