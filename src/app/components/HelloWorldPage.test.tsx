import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HelloWorldPage from './HelloWorldPage';

describe('HelloWorldPage Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render the page section', () => {
    render(<HelloWorldPage />);
    expect(screen.getByTestId('page-section')).toBeInTheDocument();
  });

  it('should render the stack container', () => {
    render(<HelloWorldPage />);
    expect(screen.getByTestId('stack')).toBeInTheDocument();
  });

  it('should render the title with TerminalIcon', () => {
    render(<HelloWorldPage />);
    expect(screen.getByText('Hello World Plugin')).toBeInTheDocument();
    expect(screen.getByTestId('terminal-icon')).toBeInTheDocument();
  });

  it('should render the welcome description text', () => {
    render(<HelloWorldPage />);
    expect(screen.getByText(/This is a simple.*Hello World.*plugin/)).toBeInTheDocument();
  });

  it('should render the click button with initial count', () => {
    render(<HelloWorldPage />);
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('(0)');
  });

  it('should render the plugin version footer', () => {
    render(<HelloWorldPage />);
    expect(screen.getByText(/Plugin Version: 0\.1\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Deployment Mode: Module Federation/)).toBeInTheDocument();
  });

  it('should show alert when button is clicked', () => {
    render(<HelloWorldPage />);
    const button = screen.getByTestId('button');

    expect(screen.queryByTestId('alert')).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.getByText('Welcome to RHOAI!')).toBeInTheDocument();
  });

  it('should increment click count when button is clicked', () => {
    render(<HelloWorldPage />);
    const button = screen.getByTestId('button');

    fireEvent.click(button);
    expect(button).toHaveTextContent('(1)');

    fireEvent.click(button);
    expect(button).toHaveTextContent('(2)');

    fireEvent.click(button);
    expect(button).toHaveTextContent('(3)');
  });

  it('should hide alert after 3 seconds', () => {
    render(<HelloWorldPage />);
    const button = screen.getByTestId('button');

    fireEvent.click(button);
    expect(screen.getByTestId('alert')).toBeInTheDocument();

    // Advance timers by 3 seconds
    jest.advanceTimersByTime(3000);

    expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
  });

  it('should hide alert when close button is clicked', () => {
    render(<HelloWorldPage />);
    const button = screen.getByTestId('button');

    fireEvent.click(button);
    expect(screen.getByTestId('alert')).toBeInTheDocument();

    // The alert component has an onClose handler
    // Click the alert itself to trigger close
    fireEvent.click(screen.getByTestId('alert'));

    // After clicking, the alert should be hidden (our mock hides it on close)
    expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
  });

  it('should render all stack items', () => {
    render(<HelloWorldPage />);
    const stackItems = screen.getAllByTestId('stack-item');
    expect(stackItems.length).toBeGreaterThan(0);
  });

  it('should render flex containers', () => {
    render(<HelloWorldPage />);
    const flexContainers = screen.getAllByTestId('flex');
    expect(flexContainers.length).toBeGreaterThan(0);
  });

  it('should render text content areas', () => {
    render(<HelloWorldPage />);
    expect(screen.getAllByTestId('text-content')).toHaveLength(2);
  });

  it('should render the CheckCircleIcon on the button', () => {
    render(<HelloWorldPage />);
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
  });
});
