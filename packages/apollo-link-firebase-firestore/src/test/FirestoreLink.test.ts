import {Observable, Operation, NextLink} from 'apollo-link';
import {createFirestoreLink, FirestoreLink} from '../FirestoreLink';
import {mutationResolver} from '../mutationResolver';
import {queryResolver} from '../queryResolver';
import {mockFirestore} from './utilities';

jest.mock('apollo-utilities', () => ({
  ...jest.requireActual('apollo-utilities'),
  getMainDefinition: jest.fn(),
  addTypenameToDocument: jest.fn((arg: any) => arg),
}));

jest.mock('graphql/language', () => ({
  ...jest.requireActual('apollo-utilities'),
  visit: jest.fn(),
}));

jest.mock('graphql-anywhere/lib/async', () => ({
  ...jest.requireActual('graphql-anywhere/lib/async'),
  graphql: jest.fn(),
}));

const getMainDefinitionMock: jest.Mock = jest.requireMock('apollo-utilities')
  .getMainDefinition;
const graphqlMock: jest.Mock = jest.requireMock('graphql-anywhere/lib/async')
  .graphql;
const visitMock: jest.Mock = jest.requireMock('graphql/language').visit;

describe('createFirestoreLink()', () => {
  const mockMainDefinition = {
    kind: 'OperationDefinition',
    name: {value: 'test'},
    operation: 'query',
  };
  const mockGraphQLResult = Promise.resolve({});
  const mockStore = mockFirestore();

  beforeEach(() => {
    getMainDefinitionMock.mockImplementation(() => mockMainDefinition);
    graphqlMock.mockImplementation(() => mockGraphQLResult);
  });

  afterEach(() => {
    getMainDefinitionMock.mockReset();
    graphqlMock.mockReset();
    visitMock.mockReset();
  });

  it('creates a firestore link', () => {
    expect(createFirestoreLink(mockStore)).toBeInstanceOf(FirestoreLink);
  });
});

describe('FirestoreLink', () => {
  const mockMainDefinition = {
    kind: 'OperationDefinition',
    name: {value: 'test'},
    operation: 'query',
  };
  const mockGraphQLResult = Promise.resolve({});
  const mockStore = mockFirestore();
  const mockOperation = {
    variables: {},
    query: {},
  } as Operation;

  beforeEach(() => {
    getMainDefinitionMock.mockImplementation(() => mockMainDefinition);
    graphqlMock.mockImplementation(() => mockGraphQLResult);
  });

  afterEach(() => {
    getMainDefinitionMock.mockReset();
    graphqlMock.mockReset();
    visitMock.mockReset();
  });

  it('ignores non-firestore queries', () => {
    const nextLink: NextLink = jest.fn();
    const link = new FirestoreLink(mockStore);
    link.request(mockOperation, nextLink);

    expect(nextLink).toHaveBeenCalledWith(mockOperation);
  });

  it('ignores fragments', () => {
    const nextLink: NextLink = jest.fn();
    getMainDefinitionMock.mockImplementation(() => ({
      ...mockMainDefinition,
      kind: 'FragmentDefinition',
    }));
    const link = new FirestoreLink(mockStore);
    link.request(mockOperation, nextLink);

    expect(nextLink).toHaveBeenCalledWith(mockOperation);
  });

  it('returns null for non-firestore queries if there is no forward function', () => {
    const link = new FirestoreLink(mockStore);

    expect(link.request(mockOperation)).toBeNull();
  });

  it('observes firestore queries and emits results', async () => {
    const data = {};
    const result = jest.fn();
    getMainDefinitionMock.mockImplementation(() => ({
      ...mockMainDefinition,
      directives: [{name: {value: 'query'}}],
    }));
    graphqlMock.mockImplementation(() => Promise.resolve(data));
    const link = new FirestoreLink(mockStore);
    const observable = link.request(mockOperation);

    expect(observable).toBeInstanceOf(Observable);

    await observable!.forEach(result);

    expect(result).toHaveBeenCalledTimes(1);
    expect(result).toHaveBeenCalledWith({data}, expect.anything());
  });

  it('ignores AbortError', () => {
    const result = jest.fn();
    getMainDefinitionMock.mockImplementation(() => ({
      ...mockMainDefinition,
      directives: [{name: {value: 'query'}}],
    }));
    // eslint-disable-next-line prefer-promise-reject-errors
    graphqlMock.mockImplementation(() => Promise.reject({name: 'AbortError'}));
    const link = new FirestoreLink(mockStore);
    const observable = link.request(mockOperation);

    observable!.subscribe(result);

    expect(result).not.toHaveBeenCalled();
  });

  it('emits an error if there is no data', async () => {
    getMainDefinitionMock.mockImplementation(() => ({
      ...mockMainDefinition,
      directives: [{name: {value: 'query'}}],
    }));
    graphqlMock.mockImplementation(() => Promise.resolve(null));
    const link = new FirestoreLink(mockStore);
    const observable = link.request(mockOperation);

    await expect(observable!.forEach(() => {})).toReject();
  });

  it('emits response errors', async () => {
    const data = {errors: ['test']};
    const result = jest.fn();
    getMainDefinitionMock.mockImplementation(() => ({
      ...mockMainDefinition,
      directives: [{name: {value: 'query'}}],
    }));
    // eslint-disable-next-line prefer-promise-reject-errors
    graphqlMock.mockImplementation(() => Promise.reject({result: data}));
    const link = new FirestoreLink(mockStore);
    const observable = link.request(mockOperation);

    await expect(observable!.forEach(result)).toReject();
    expect(result).toHaveBeenCalledWith(data, expect.anything());
  });

  it('uses the queryResolver for queries', async () => {
    getMainDefinitionMock.mockImplementation(() => ({
      ...mockMainDefinition,
      directives: [{name: {value: 'query'}}],
      operation: 'query',
    }));
    graphqlMock.mockImplementation(() => Promise.resolve(mockGraphQLResult));
    const link = new FirestoreLink(mockStore);
    const observable = link.request(mockOperation);

    await observable!.forEach(() => {});

    expect(graphqlMock).toHaveBeenCalledWith(
      queryResolver,
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it('uses the mutationResolver for mutations', async () => {
    getMainDefinitionMock.mockImplementation(() => ({
      ...mockMainDefinition,
      directives: [{name: {value: 'query'}}],
      operation: 'mutation',
    }));
    graphqlMock.mockImplementation(() => Promise.resolve(mockGraphQLResult));
    const link = new FirestoreLink(mockStore);
    const observable = link.request(mockOperation);

    await observable!.forEach(() => {});

    expect(graphqlMock).toHaveBeenCalledWith(
      mutationResolver,
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it('watches a query when subscribed', async () => {
    const directive = {
      name: {value: 'query'},
      arguments: [
        {
          name: {value: 'subscribe'},
          value: {kind: 'BooleanValue', value: true},
        },
      ],
    };
    getMainDefinitionMock.mockImplementation(() => ({
      ...mockMainDefinition,
      directives: [directive],
    }));
    graphqlMock.mockImplementationOnce(() =>
      Promise.resolve(mockGraphQLResult),
    );
    graphqlMock.mockImplementationOnce(() => Promise.resolve(null));
    visitMock.mockImplementation((_query, {Directive}) => {
      Directive(directive);
    });
    const link = new FirestoreLink(mockStore);
    const observable = link.request(mockOperation);
    await new Promise((resolve) => {
      observable!.subscribe({
        next() {
          if (graphqlMock.mock.calls.length === 1) {
            setImmediate(graphqlMock.mock.calls[0][3].onSnapshot.next, {});
          }
        },
        complete: resolve,
        error: resolve,
      });
    });

    expect(graphqlMock).toHaveBeenCalledTimes(2);
  });
});
