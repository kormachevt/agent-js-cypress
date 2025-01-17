/*
 *  Copyright 2020 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

module.exports = {
  moduleFileExtensions: ['js'],
  testRegex: '/test/.*\\.test.(js)$',
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/commands/**/*.js',
    '!lib/plugin/**/*.js',
    '!lib/mergeLaunchesUtils.js',
    '!lib/mergeLaunches.js',
    '!lib/cypressReporter.js',
    '!lib/ipcEvents.js',
    '!lib/ipcServer.js',
    '!lib/testStatuses.js',
    '!lib/worker.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/cypress/',
    '<rootDir>/node_modules/',
    '<rootDir>/lib/test/mock/',
  ],
};
