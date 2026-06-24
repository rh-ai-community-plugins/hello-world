import React from 'react';
import { render, screen } from '@testing-library/react';
import HelloIcon from './HelloWorldNavIcon';

describe('HelloWorldNavIcon (HelloIcon) Component', () => {
  it('should render the SVG icon', () => {
    const { container } = render(<HelloIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render with the correct width and height attributes', () => {
    const { container } = render(<HelloIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('should have the correct viewBox', () => {
    const { container } = render(<HelloIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should apply custom className when provided', () => {
    const { container } = render(<HelloIcon className="custom-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('should render the HW text', () => {
    const { container } = render(<HelloIcon />);
    const textElement = container.querySelector('text');
    expect(textElement).toBeInTheDocument();
    expect(textElement?.textContent).toBe('HW');
  });

  it('should render the rectangle background', () => {
    const { container } = render(<HelloIcon />);
    const rect = container.querySelector('rect');
    expect(rect).toBeInTheDocument();
    expect(rect).toHaveAttribute('width', '24');
    expect(rect).toHaveAttribute('height', '24');
  });

  it('should have purple fill color on the background rectangle', () => {
    const { container } = render(<HelloIcon />);
    const rect = container.querySelector('rect');
    expect(rect).toHaveAttribute('fill', '#6b21a8');
  });

  it('should have white text color', () => {
    const { container } = render(<HelloIcon />);
    const text = container.querySelector('text');
    expect(text).toHaveAttribute('fill', 'white');
  });

  it('should have bold font weight on text', () => {
    const { container } = render(<HelloIcon />);
    const text = container.querySelector('text');
    expect(text).toHaveAttribute('font-weight', 'bold');
  });

  it('should have correct font size', () => {
    const { container } = render(<HelloIcon />);
    const text = container.querySelector('text');
    expect(text).toHaveAttribute('font-size', '12');
  });

  it('should center the text horizontally', () => {
    const { container } = render(<HelloIcon />);
    const text = container.querySelector('text');
    expect(text).toHaveAttribute('text-anchor', 'middle');
  });
});
