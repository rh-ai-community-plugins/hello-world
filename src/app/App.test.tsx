import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('should render the App component', () => {
    render(<App />);
    // After initialization, the component renders Routes with HelloWorldPage
    // The title from HelloWorldPage should be visible
    expect(screen.getByTestId('title')).toBeInTheDocument();
  });

  it('should render the TerminalIcon from HelloWorldPage', () => {
    render(<App />);
    expect(screen.getByTestId('terminal-icon')).toBeInTheDocument();
  });

  it('should render the page title "Hello World Plugin"', () => {
    render(<App />);
    expect(screen.getByText('Hello World Plugin')).toBeInTheDocument();
  });

  it('should render the description text', () => {
    render(<App />);
    expect(screen.getByText(/This is a simple.*Hello World.*plugin/)).toBeInTheDocument();
  });

  it('should render the click button', () => {
    render(<App />);
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });

  it('should render the plugin version text', () => {
    render(<App />);
    expect(screen.getByText(/Plugin Version: 0\.1\.0/)).toBeInTheDocument();
  });
});
