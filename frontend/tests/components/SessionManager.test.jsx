import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionManager from '../../src/components/SessionManager';

describe('SessionManager – simpel', () => {
  test('Start Callback', () => {
    const onStart = jest.fn();
    render(
      <SessionManager
        activeSession={null}
        selectedSession={null}
        sessions={[]}
        onStart={onStart}
        onEnd={jest.fn()}
        onSelect={jest.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/Name/i), { target: { value: 'X' } });
    fireEvent.click(screen.getByText(/^Start$/));
    expect(onStart).toHaveBeenCalled();
  });
});
