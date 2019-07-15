import {pascalCase} from 'change-case';
import {firestore} from 'firebase/app';
import {
  QueryError,
  queryResolver,
  refForPath,
  resolveCollectionQuery,
  resolveDocQuery,
  resolveQuerySnapshot,
  resolveSnapshot,
  resolveTypename,
} from '../queryResolver';
import {
  FirestoreExecInfo,
  FirestoreReferenceType,
  QueryResolverContext,
  ResolverRoot,
  RootQueryDirectiveArgs,
} from '../types';
import {
  mockCollectionRef,
  mockDocRef,
  mockDocSnapshot,
  mockFirestore,
  mockQuerySnapshot,
} from './utilities';

jest.mock('../createQuery', () => ({
  createQuery: jest.fn(),
}));

const createQueryMock: jest.Mock = jest.requireMock('../createQuery')
  .createQuery;

describe('queryResolver()', () => {
  const defaultMockContext: QueryResolverContext = {
    fields: {},
    store: mockFirestore(),
  };
  const defaultMockInfo: FirestoreExecInfo = {
    directives: null,
    field: {
      kind: 'Field',
      name: {
        kind: 'Name',
        value: 'field',
      },
    },
    isLeaf: true,
    resultKey: 'field',
  };

  beforeEach(() => {
    createQueryMock.mockImplementation((_args, _fields, ref) => ref);
  });

  afterEach(() => {
    createQueryMock.mockReset();
  });

  it('resolves a collection query for a collection query directive', async () => {
    const fieldName = 'Field';
    const docs = [mockDocSnapshot({id: '123'})];
    const snapshot = mockQuerySnapshot({
      docs,
    });
    const ref = mockCollectionRef({
      get() {
        return Promise.resolve(snapshot);
      },
    });
    const context = {
      ...defaultMockContext,
      store: mockFirestore({
        collection() {
          return ref;
        },
      }),
    };
    const info = {
      ...defaultMockInfo,
      isLeaf: false,
      directives: {query: {rootType: FirestoreReferenceType.Collection}},
    };
    // eslint-disable-next-line no-proto
    (ref as any).__proto__ = firestore.CollectionReference.prototype;

    expect(await queryResolver(fieldName, {}, {}, context, info)).toMatchObject(
      docs.map((snapshot) => ({__typename: fieldName, snapshot})),
    );
  });

  it('resolves a doc query for a doc query directive', async () => {
    const fieldName = 'Field';
    const snapshot = mockDocSnapshot({
      id: '123',
    });
    const ref = mockDocRef({
      get() {
        return Promise.resolve(snapshot);
      },
    });
    const context = {
      ...defaultMockContext,
      store: mockFirestore({
        doc() {
          return ref;
        },
      }),
    };
    const info = {
      ...defaultMockInfo,
      isLeaf: false,
      directives: {query: {rootType: FirestoreReferenceType.Document}},
    };
    // eslint-disable-next-line no-proto
    (ref as any).__proto__ = firestore.DocumentReference.prototype;

    expect(await queryResolver(fieldName, {}, {}, context, info)).toMatchObject(
      {
        __typename: fieldName,
        snapshot,
      },
    );
  });

  it('uses the query directive path value instead of the field name', async () => {
    const path = 'foo';
    const context = {
      ...defaultMockContext,
      store: mockFirestore({
        doc: jest.fn(() => mockDocRef()),
      }),
    };
    const info = {
      ...defaultMockInfo,
      isLeaf: false,
      directives: {query: {path, rootType: FirestoreReferenceType.Document}},
    };

    await queryResolver('field', {}, {}, context, info);

    expect(context.store.doc).toHaveBeenCalledWith(path);
  });

  it('resolves the snapshot if there is no query directive', () => {
    const context = {...defaultMockContext};
    const info = {...defaultMockInfo, isLeaf: true};
    const id = '123';
    const snapshot = mockDocSnapshot({
      id,
    });
    const root: ResolverRoot = {__typename: 'Field', snapshot};

    expect(queryResolver('id', root, {}, context, info)).toBe(id);
  });

  it('throws an error if query directive or snapshot', () => {
    const context = {...defaultMockContext};
    const info = {...defaultMockInfo};

    expect(() => queryResolver('field', {}, {}, context, info)).toThrow(
      /^Invalid query: no snapshot or query directive/,
    );
  });
});

describe('refForPath()', () => {
  it('throws an error if rootType is missing', () => {
    expect(() => refForPath('path', null as any, mockFirestore())).toThrow(
      /^Invalid query: rootType is required/,
    );
  });

  it('creates a single path root collection ref', () => {
    const path = 'path';
    const rootType = FirestoreReferenceType.Collection;
    const ref = mockCollectionRef();
    const store = mockFirestore({
      collection: jest.fn(() => ref),
      doc: jest.fn(),
    });

    expect(refForPath(path, rootType, store)).toBe(ref);
    expect(store.collection).toHaveBeenCalledTimes(1);
    expect(store.collection).toHaveBeenCalledWith(path);
    expect(store.doc).not.toHaveBeenCalled();
  });

  it('creates a multi path root collection ref', () => {
    const collectionPath = 'collection';
    const docPath = 'doc';
    const path = `${collectionPath}.${docPath}`;
    const rootType = FirestoreReferenceType.Collection;
    const doc = mockDocRef();
    const collection = mockCollectionRef({
      doc: jest.fn(() => doc),
    });
    const store = mockFirestore({
      collection: jest.fn(() => collection),
    });
    // eslint-disable-next-line no-proto
    (collection as any).__proto__ = firestore.CollectionReference.prototype;

    expect(refForPath(path, rootType, store)).toBe(doc);
    expect(store.collection).toHaveBeenCalledTimes(1);
    expect(store.collection).toHaveBeenCalledWith(collectionPath);
    expect(collection.doc).toHaveBeenCalledTimes(1);
    expect(collection.doc).toHaveBeenCalledWith(docPath);
  });

  it('creates a single path root doc ref', () => {
    const path = 'path';
    const rootType = FirestoreReferenceType.Document;
    const ref = mockDocRef();
    const store = mockFirestore({
      collection: jest.fn(),
      doc: jest.fn(() => ref),
    });

    expect(refForPath(path, rootType, store)).toBe(ref);
    expect(store.doc).toHaveBeenCalledTimes(1);
    expect(store.doc).toHaveBeenCalledWith(path);
    expect(store.collection).not.toHaveBeenCalled();
  });

  it('creates a multi path root doc ref', () => {
    const collectionPath = 'collection';
    const docPath = 'doc';
    const path = `${docPath}.${collectionPath}`;
    const rootType = FirestoreReferenceType.Document;
    const collection = mockCollectionRef();
    const doc = mockDocRef({
      collection: jest.fn(() => collection),
    });
    const store = mockFirestore({
      doc: jest.fn(() => doc),
    });
    // eslint-disable-next-line no-proto
    (doc as any).__proto__ = firestore.DocumentReference.prototype;

    expect(refForPath(path, rootType, store)).toBe(collection);
    expect(store.doc).toHaveBeenCalledTimes(1);
    expect(store.doc).toHaveBeenCalledWith(docPath);
    expect(doc.collection).toHaveBeenCalledTimes(1);
    expect(doc.collection).toHaveBeenCalledWith(collectionPath);
  });
});

describe('resolveCollectionQuery()', () => {
  const defaultMockArgs: RootQueryDirectiveArgs = {
    rootType: FirestoreReferenceType.Collection,
  };
  const defaultMockContext: QueryResolverContext = {
    fields: {},
    store: mockFirestore(),
  };

  it('returns an array of each doc snapshot and __typename', async () => {
    const context = {...defaultMockContext};
    const docs = [
      mockDocSnapshot({
        id: '123',
      }),
    ];
    const snapshot = mockQuerySnapshot({docs});
    const ref = mockCollectionRef({
      get() {
        return Promise.resolve(snapshot);
      },
    });
    const fieldName = 'Field';
    const args = {...defaultMockArgs};

    expect(
      await resolveCollectionQuery(ref, fieldName, context, args),
    ).toMatchObject(
      docs.map((snapshot) => ({__typename: fieldName, snapshot})),
    );
  });
});

describe('resolveDocQuery()', () => {
  const defaultMockArgs: RootQueryDirectiveArgs = {
    rootType: FirestoreReferenceType.Document,
  };
  const defaultMockContext: QueryResolverContext = {
    fields: {},
    store: mockFirestore(),
  };

  it('returns the snapshot and __typename', async () => {
    const context = {...defaultMockContext};
    const snapshot = mockDocSnapshot({id: '123'});
    const ref = mockDocRef({
      get() {
        return Promise.resolve(snapshot);
      },
    });
    const fieldName = 'Field';
    const args = {...defaultMockArgs};

    expect(await resolveDocQuery(ref, fieldName, context, args)).toMatchObject({
      __typename: fieldName,
      snapshot,
    });
  });
});

describe('resolveQuerySnapshot()', () => {
  const defaultMockContext: QueryResolverContext = {
    fields: {},
    store: mockFirestore(),
  };

  it('invokes the ref onSnapshot if context is defined and subscribe is set', () => {
    const ref = mockDocRef({
      onSnapshot: jest.fn(),
    });
    const context = {
      ...defaultMockContext,
      onSnapshot: {},
    };
    const args = {
      subscribe: true,
    };

    resolveQuerySnapshot(ref, context, args);

    expect(ref.onSnapshot).toHaveBeenCalled();
  });

  it('does not invoke the ref onSnapshot if context is defined and subscribe is not set', () => {
    const ref = mockDocRef({
      onSnapshot: jest.fn(),
    });
    const context = {
      ...defaultMockContext,
      onSnapshot: {},
    };
    const args = {
      subscribe: false,
    };

    resolveQuerySnapshot(ref, context, args);

    expect(ref.onSnapshot).not.toHaveBeenCalled();
  });

  it('invokes the ref onSnapshot with the onSnapshot in the context', () => {
    const ref = mockDocRef({
      onSnapshot: jest.fn(),
    });
    const context = {
      ...defaultMockContext,
      onSnapshot: {},
    };
    const args = {
      subscribe: true,
    };

    resolveQuerySnapshot(ref, context, args);

    expect(ref.onSnapshot).toHaveBeenCalledWith(context.onSnapshot);
  });

  it('returns the result of get', async () => {
    const result = mockDocSnapshot();
    const ref = mockDocRef({
      get: jest.fn(() => Promise.resolve(result)),
    });
    const context = {
      ...defaultMockContext,
    };

    expect(await resolveQuerySnapshot(ref, context)).toBe(result);
  });

  it('invokes get with the provided ref source', () => {
    const source: firestore.GetOptions['source'] = 'default';
    const ref = mockDocRef({
      get: jest.fn(),
    });
    const context = {
      ...defaultMockContext,
    };
    const args = {
      source,
    };

    resolveQuerySnapshot(ref, context, args);

    expect(ref.get).toHaveBeenCalledWith({source});
  });
});

describe('resolveSnapshot()', () => {
  const defaultMockContext: QueryResolverContext = {
    fields: {},
    store: mockFirestore(),
  };
  const defaultMockInfo: FirestoreExecInfo = {
    directives: null,
    field: {
      kind: 'Field',
      name: {
        kind: 'Name',
        value: 'field',
      },
    },
    isLeaf: true,
    resultKey: 'field',
  };

  beforeEach(() => {
    createQueryMock.mockImplementation((_args, _fields, ref) => ref);
  });

  afterEach(() => {
    createQueryMock.mockReset();
  });

  function mockRoot(props: Partial<ResolverRoot> = {}): Required<ResolverRoot> {
    return {
      __typename: 'type',
      snapshot: mockDocSnapshot(),
      ...props,
    };
  }

  it('resolves __typename for leaf nodes', () => {
    const __typename = 'test';
    const context = {...defaultMockContext};
    const info = {
      ...defaultMockInfo,
      isLeaf: true,
    };
    const root = mockRoot({__typename});

    expect(resolveSnapshot('__typename', root, {}, context, info)).toBe(
      __typename,
    );
  });

  it('resolves id for leaf nodes', () => {
    const id = '123';
    const context = {...defaultMockContext};
    const info = {
      ...defaultMockInfo,
      isLeaf: true,
    };
    const root = mockRoot({snapshot: mockDocSnapshot({id})});

    expect(resolveSnapshot('id', root, {}, context, info)).toBe(id);
  });

  it('fetches the field name from the snapshot for leaf nodes', () => {
    const context = {...defaultMockContext};
    const info = {
      ...defaultMockInfo,
      isLeaf: true,
    };
    const fieldName = 'field';
    const value = 'test';
    const get = jest.fn(() => value);
    const root = mockRoot({snapshot: mockDocSnapshot({get})});

    expect(resolveSnapshot(fieldName, root, {}, context, info)).toBe(value);
    expect(get).toHaveBeenCalledWith(fieldName, expect.anything());
  });

  it('fetches the field from the snapshot with the provided serverTimestamps', () => {
    const context = {...defaultMockContext};
    const serverTimestamps: firestore.SnapshotOptions['serverTimestamps'] =
      'estimate';
    const info = {
      ...defaultMockInfo,
      directives: {
        field: {
          serverTimestamps,
        },
      },
      isLeaf: true,
    };
    const fieldName = 'field';
    const value = 'test';
    const get = jest.fn(() => value);
    const root = mockRoot({snapshot: mockDocSnapshot({get})});

    resolveSnapshot(fieldName, root, {}, context, info);

    expect(get).toHaveBeenCalledWith(fieldName, {serverTimestamps});
  });

  it('exports the value as the if the key directive if present for leaf nodes', () => {
    const fields = {};
    const context = {
      ...defaultMockContext,
      fields,
    };
    const key = 'key';
    const info = {
      ...defaultMockInfo,
      directives: {
        field: {
          key,
        },
      },
      isLeaf: true,
    };
    const fieldName = 'field';
    const value = 'test';
    const get = jest.fn(() => value);
    const root = mockRoot({snapshot: mockDocSnapshot({get})});

    resolveSnapshot(fieldName, root, {}, context, info);

    expect(fields).toMatchObject({[key]: value});
  });

  it('exports the value as field name if the key directive is present for leaf nodes', () => {
    const fields = {};
    const context = {
      ...defaultMockContext,
      fields,
    };
    const info = {
      ...defaultMockInfo,
      directives: {
        field: {
          key: true as true,
        },
      },
      isLeaf: true,
    };
    const fieldName = 'field';
    const value = 'test';
    const get = jest.fn(() => value);
    const root = mockRoot({snapshot: mockDocSnapshot({get})});

    resolveSnapshot(fieldName, root, {}, context, info);

    expect(fields).toMatchObject({[fieldName]: value});
  });

  it('resolves the collection for non-leaf nodes', async () => {
    const fieldName = 'Field';
    const fields = {};
    const context = {
      ...defaultMockContext,
      fields,
    };
    const info = {
      ...defaultMockInfo,
      isLeaf: false,
    };
    const snapshot = mockQuerySnapshot({docs: [mockDocSnapshot({id: '123'})]});
    const get = jest.fn(() => Promise.resolve(snapshot));
    const collection = jest.fn(() => mockCollectionRef({get}));
    const root = mockRoot({
      snapshot: mockDocSnapshot({ref: mockDocRef({collection})}),
    });

    expect(
      await resolveSnapshot(fieldName, root, {}, context, info),
    ).toMatchObject(
      snapshot.docs.map((snapshot) => ({
        __typename: fieldName,
        snapshot,
      })),
    );
    expect(get).toHaveBeenCalled();
    expect(collection).toHaveBeenCalledWith(fieldName);
  });

  it('can override ref args with the ref directive', async () => {
    const source: firestore.GetOptions['source'] = 'default';
    const context = {
      ...defaultMockContext,
    };
    const info = {
      ...defaultMockInfo,
      directives: {ref: {source}},
      isLeaf: false,
    };
    const get = jest.fn(() => Promise.resolve(mockQuerySnapshot()));
    const collection = jest.fn(() => mockCollectionRef({get}));
    const root = mockRoot({
      snapshot: mockDocSnapshot({ref: mockDocRef({collection})}),
    });

    await resolveSnapshot('field', root, {}, context, info);

    expect(get).toHaveBeenCalledWith({source});
  });
});

describe('resolveTypename()', () => {
  it('returns the directive provided type if it exists', () => {
    const type = 'test';

    expect(resolveTypename({type}, 'field')).toBe(type);
  });

  it('returns the field name if directive does not provide a type', () => {
    const field = 'Test';

    expect(resolveTypename({}, field)).toBe(field);
  });

  it('converts the field name to pascal case', () => {
    const field = 'test';

    expect(resolveTypename({}, field)).toBe(pascalCase(field));
  });

  it('strips the "s" off the end of the field name', () => {
    const field = 'Tests';

    expect(resolveTypename({}, field)).toBe(field.replace(/s$/, ''));
  });
});

describe('QueryError', () => {
  it('has a message that starts with Invalid query', () => {
    expect(new QueryError('')).toMatchObject({
      message: expect.stringMatching(/^Invalid query/),
    });
  });

  it('has a message ending in the constructor param', () => {
    const message = 'testing';
    expect(new QueryError(message)).toMatchObject({
      message: expect.stringMatching(new RegExp(`${message}$`)),
    });
  });
});
