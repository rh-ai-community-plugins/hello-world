import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import HelloWorldPage from './HelloWorldPage';

describe('HelloWorldPage Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render the page title', () => {
    render(<HelloWorldPage />);
    expect(screen.getByText('Hello World Plugin')).toBeInTheDocument();
  });

  it('should render the description text', () => {
    render(<HelloWorldPage />);
    expect(screen.getByText(/This is a simple/)).toBeInTheDocument();
  });

  it('should render the click button with initial count', () => {
    render(<HelloWorldPage />);
    const button = screen.getByRole('button', { name: /Click Me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('0');
  });

  it('should render the plugin version footer', () => {
    render(<HelloWorldPage />);
    expect(screen.getByText(/Plugin Version: 0\.1\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Deployment Mode: Module Federation/)).toBeInTheDocument();
  });

  it('should show alert when button is clicked', () => {
    render(<HelloWorldPage />);
    const button = screen.getByRole('button', { name: /Click Me/i });

    expect(screen.queryByText('Welcome to RHOAI!')).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByText('Welcome to RHOAI!')).toBeInTheDocument();
  });

  it('should increment click count when button is clicked', () => {
    render(<HelloWorldPage />);
    const button = screen.getByRole('button', { name: /Click Me/i });

    fireEvent.click(button);
    expect(button).toHaveTextContent('1');

    fireEvent.click(button);
    expect(button).toHaveTextContent('2');

    fireEvent.click(button);
    expect(button).toHaveTextContent('3');
  });

  it('should hide alert after 3 seconds', async () => {
    render(<HelloWorldPage />);
    const button = screen.getByRole('button', { name: /Click Me/i });

    fireEvent.click(button);
    expect(screen.getByText('Welcome to RHOAI!')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Welcome to RHOAI!')).not.toBeInTheDocument();
  });

  it('should hide alert when close button is clicked', () => {
    render(<HelloWorldPage />);
    fireEvent.click(screen.getByRole('button', { name: /Click Me/i }));
    expect(screen.getByText('Welcome to RHOAI!')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close Success alert: alert: Welcome to RHOAI!');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Welcome to RHOAI!')).not.toBeInTheDocument();
  });
});
