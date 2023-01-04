import React from 'react';
import { findByText, fireEvent, getAllByTestId, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

test('render provider select', () => {
  render(<App />);

  const providerSelect = screen.getByTestId('providerSelect');
  expect(providerSelect).toBeInTheDocument();
});

test('render latitude label and input box', () => {
  render(<App />);

  const latitudeLabel = screen.getByLabelText(/Latitude/);
  expect(latitudeLabel).toBeInTheDocument();

  const latitudeInputBox = screen.getByTestId('latitudeBox');
  expect(latitudeInputBox).toBeInTheDocument();
  expect(latitudeInputBox).toHaveAttribute('type', 'text');
});

test('render longitude label and input box', () => {
  render(<App />);

  const longitudeLabel = screen.getByLabelText(/Longitude/);
  expect(longitudeLabel).toBeInTheDocument();

  const longitudeInputBox = screen.getByTestId('longitudeBox');
  expect(longitudeInputBox).toBeInTheDocument();
  expect(longitudeInputBox).toHaveAttribute('type', 'text');
});

test('render search button', () => {
  render(<App />);

  const searchButton = screen.getByText(/Search/);
  expect(searchButton).toBeInTheDocument();
});

test('render current location button', () => {
  render(<App />);

  const currentLocationButton = screen.getByTestId('currentLocationButton');
  expect(currentLocationButton).toBeInTheDocument();
  expect(currentLocationButton).toBeEnabled();

});

test('check providerSelect is set to default, latitude and longitude input boxes are null and search button is disabled after render', () => {
  render(<App />);
  const providerSelect = screen.getByTestId('providerSelect');
  expect(providerSelect).toHaveValue('default');

  const latitudeInputBox = screen.getByTestId('latitudeBox');
  expect(latitudeInputBox).toHaveValue('');

  const longitudeInputBox = screen.getByTestId('longitudeBox');
  expect(longitudeInputBox).toHaveValue('');

  const searchButton = screen.getByTestId('searchButton');
  expect(searchButton).toBeDisabled();
});