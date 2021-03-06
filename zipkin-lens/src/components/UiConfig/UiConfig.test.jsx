/*
 * Copyright 2015-2020 The OpenZipkin Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */
import { render } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';

import { UI_CONFIG } from '../../constants/api';

afterEach(() => {
  fetchMock.restore();
});

beforeEach(() => {
  // We fetch the resource on module initialization for performance, but want to do that in every
  // test.
  jest.resetModules();
});

const UiConfig = () => {
  const UiConfigModule = require('./UiConfig');
  const UiConfig = UiConfigModule.UiConfig;
  const UiConfigConsumer = UiConfigModule.UiConfigConsumer;

  return (
    <Suspense fallback="Suspended">
      <UiConfig>
        <UiConfigConsumer>
          {value => (
            <div>{JSON.stringify(value)}</div>
          )}
        </UiConfigConsumer>
      </UiConfig>
    </Suspense>
  );
};

test('fetches config and suspends', async () => {
  const configPromise = new Promise(() => undefined);
  fetchMock.mock('*', configPromise);

  const { getByText } = render(<UiConfig />);
  expect(getByText('Suspended')).toBeInTheDocument();

  fetchMock.called(UI_CONFIG);
});

test('provides config when resolved', async () => {
  const config = { defaultLookback: 100 };
  fetchMock.once('*', config);

  const { getByText, rerender } = render(<UiConfig />);
  expect(getByText('Suspended')).toBeInTheDocument();

  // We need to get off the processing loop to allow the promise to complete and resolve the
  // config.
  await new Promise(resolve => setTimeout(resolve, 1));

  rerender(<UiConfig />);
  expect(getByText(JSON.stringify(config))).toBeInTheDocument();

  fetchMock.called(UI_CONFIG);
});
