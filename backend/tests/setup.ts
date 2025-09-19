import pool from '../src/db';

beforeEach(() => {
  jest.spyOn(pool, 'connect').mockImplementation((): any => {
    return {
      query: jest.fn(),
      release: jest.fn(),
    };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
