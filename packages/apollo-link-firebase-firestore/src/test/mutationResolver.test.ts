import {firestore} from 'firebase/app';
import {
  MutationError,
  mutationRefForPath,
  mutationResolver,
  resolveMutation,
} from '../mutationResolver';
import {FirestoreReferenceType, FirestoreMutationType} from '../types';
import {mockFirestore, mockDocRef} from './utilities';

jest.mock('../queryResolver', () => ({
  ...jest.requireActual('../queryResolver'),
  refForPath: jest.fn(),
  resolveDocQuery: jest.fn(),
  resolveSnapshot: jest.fn(),
  resolveTypename: jest.fn(),
}));

const refForPathMock: jest.Mock = jest.requireMock('../queryResolver')
  .refForPath;
const resolveDocQueryMock: jest.Mock = jest.requireMock('../queryResolver')
  .resolveDocQuery;
const resolveSnapshotMock: jest.Mock = jest.requireMock('../queryResolver')
  .resolveSnapshot;
const resolveTypenameMock: jest.Mock = jest.requireMock('../queryResolver')
  .resolveTypename;

describe('mutationRefForPath()', () => {
  it('returns the result of refForPath for an add mutation', () => {
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
    };
    const path = 'path';
    const rootType = FirestoreReferenceType.Document;
    const store = mockFirestore();
    refForPathMock.mockImplementation(() => ref);

    expect(
      mutationRefForPath(path, rootType, store, FirestoreMutationType.Add, {
        id: 'id',
      }),
    ).toBe(ref);
    expect(refForPathMock).toHaveBeenCalledWith(path, rootType, store);
  });

  it('returns the result of refForPath for a document ref', () => {
    const ref = {
      __proto__: firestore.DocumentReference.prototype,
    };
    const path = 'path';
    const rootType = FirestoreReferenceType.Document;
    const store = mockFirestore();
    refForPathMock.mockImplementation(() => ref);

    expect(
      mutationRefForPath(path, rootType, store, FirestoreMutationType.Add, {
        id: 'id',
      }),
    ).toBe(ref);
    expect(refForPathMock).toHaveBeenCalledWith(path, rootType, store);
  });

  it('returns the ref doc of the provided id for a delete mutation', () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      doc: jest.fn(() => doc),
    };
    const id = 'id';
    refForPathMock.mockImplementation(() => ref);

    expect(
      mutationRefForPath(
        'path',
        FirestoreReferenceType.Document,
        mockFirestore(),
        FirestoreMutationType.Delete,
        {
          id,
        },
      ),
    ).toBe(doc);
    expect(ref.doc).toHaveBeenCalledWith(id);
  });

  it('returns the ref doc of the provided id for a set mutation', () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      doc: jest.fn(() => doc),
    };
    const id = 'id';
    refForPathMock.mockImplementation(() => ref);

    expect(
      mutationRefForPath(
        'path',
        FirestoreReferenceType.Document,
        mockFirestore(),
        FirestoreMutationType.Set,
        {
          id,
        },
      ),
    ).toBe(doc);
    expect(ref.doc).toHaveBeenCalledWith(id);
  });

  it('returns the ref doc of the provided id for an update mutation', () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      doc: jest.fn(() => doc),
    };
    const id = 'id';
    refForPathMock.mockImplementation(() => ref);

    expect(
      mutationRefForPath(
        'path',
        FirestoreReferenceType.Document,
        mockFirestore(),
        FirestoreMutationType.Update,
        {
          id,
        },
      ),
    ).toBe(doc);
    expect(ref.doc).toHaveBeenCalledWith(id);
  });

  it('throws a MutationError if data is missing for a delete mutation', () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      doc: jest.fn(() => doc),
    };
    refForPathMock.mockImplementation(() => ref);

    expect(() =>
      mutationRefForPath(
        'path',
        FirestoreReferenceType.Document,
        mockFirestore(),
        FirestoreMutationType.Delete,
        undefined,
      ),
    ).toThrow(
      /^Invalid mutation: mutation requires a valid dataArg or dataVar/,
    );
  });

  it('throws a MutationError if data has no id for a delete mutation', () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      doc: jest.fn(() => doc),
    };
    refForPathMock.mockImplementation(() => ref);

    expect(() =>
      mutationRefForPath(
        'path',
        FirestoreReferenceType.Document,
        mockFirestore(),
        FirestoreMutationType.Delete,
        {},
      ),
    ).toThrow(
      /^Invalid mutation: mutation requires a valid id through dataArg or dataVar/,
    );
  });

  it('throws a MutationError if data is missing for a set mutation', () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      doc: jest.fn(() => doc),
    };
    refForPathMock.mockImplementation(() => ref);

    expect(() =>
      mutationRefForPath(
        'path',
        FirestoreReferenceType.Document,
        mockFirestore(),
        FirestoreMutationType.Set,
        undefined,
      ),
    ).toThrow(
      /^Invalid mutation: mutation requires a valid dataArg or dataVar/,
    );
  });

  it('throws a MutationError if data has no id for a set mutation', () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      doc: jest.fn(() => doc),
    };
    refForPathMock.mockImplementation(() => ref);

    expect(() =>
      mutationRefForPath(
        'path',
        FirestoreReferenceType.Document,
        mockFirestore(),
        FirestoreMutationType.Set,
        {},
      ),
    ).toThrow(
      /^Invalid mutation: mutation requires a valid id through dataArg or dataVar/,
    );
  });

  it('throws a MutationError if data is missing for a update mutation', () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      doc: jest.fn(() => doc),
    };
    refForPathMock.mockImplementation(() => ref);

    expect(() =>
      mutationRefForPath(
        'path',
        FirestoreReferenceType.Document,
        mockFirestore(),
        FirestoreMutationType.Update,
        undefined,
      ),
    ).toThrow(
      /^Invalid mutation: mutation requires a valid dataArg or dataVar/,
    );
  });

  it('throws a MutationError if data has no id for a update mutation', () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      doc: jest.fn(() => doc),
    };
    refForPathMock.mockImplementation(() => ref);

    expect(() =>
      mutationRefForPath(
        'path',
        FirestoreReferenceType.Document,
        mockFirestore(),
        FirestoreMutationType.Update,
        {},
      ),
    ).toThrow(
      /^Invalid mutation: mutation requires a valid id through dataArg or dataVar/,
    );
  });
});

describe('mutationResolver()', () => {
  it('throws if there is no mutationType for the mutation directive', () => {
    expect(
      mutationResolver(
        'field',
        {},
        null,
        {} as any,
        {directives: {mutation: {}}} as any,
      ),
    ).toReject();
  });

  it('throws if there is no mutation directive and no __typename', () => {
    expect(
      mutationResolver(
        'field',
        {snapshot: {} as any},
        null,
        {} as any,
        {} as any,
      ),
    ).toReject();
  });

  it('throws if there is no mutation directive and no snapshot', () => {
    expect(
      mutationResolver(
        'field',
        {__typename: 'Type'},
        null,
        {} as any,
        {} as any,
      ),
    ).toReject();
  });

  it('can perform a mutation with an inline dataArg', async () => {
    const fieldName = 'field';
    const dataArg = {id: 'id'};
    const context = {store: mockFirestore()};
    const rootType = FirestoreReferenceType.Document;
    const mutationType = FirestoreMutationType.Update;
    const directives = {mutation: {dataArg, rootType, mutationType}};
    const result = {};
    const ref = mockDocRef({update: jest.fn()});
    refForPathMock.mockImplementation(() => ref);
    resolveDocQueryMock.mockImplementation(() => result);

    expect(
      await mutationResolver(
        fieldName,
        {},
        {},
        context as any,
        {
          directives,
        } as any,
      ),
    ).toBe(result);
    expect(ref.update).toHaveBeenCalledWith(dataArg);
    expect(refForPathMock).toHaveBeenCalledWith(
      fieldName,
      rootType,
      context.store,
    );
    expect(resolveDocQueryMock).toHaveBeenCalledWith(
      ref,
      fieldName,
      context,
      directives.mutation,
    );
  });

  it('can perform a mutation with a dataVar reference', async () => {
    const fieldName = 'field';
    const dataVar = 'var';
    const args = {var: 123};
    const context = {store: mockFirestore()};
    const rootType = FirestoreReferenceType.Document;
    const mutationType = FirestoreMutationType.Update;
    const directives = {mutation: {dataVar, rootType, mutationType}};
    const result = {};
    const ref = mockDocRef({update: jest.fn()});
    refForPathMock.mockImplementation(() => ref);
    resolveDocQueryMock.mockImplementation(() => result);

    expect(
      await mutationResolver(
        fieldName,
        {},
        args,
        context as any,
        {
          directives,
        } as any,
      ),
    ).toBe(result);
    expect(ref.update).toHaveBeenCalledWith(args.var);
    expect(refForPathMock).toHaveBeenCalledWith(
      fieldName,
      rootType,
      context.store,
    );
    expect(resolveDocQueryMock).toHaveBeenCalledWith(
      ref,
      fieldName,
      context,
      directives.mutation,
    );
  });

  it('can perform a mutation with a input as the default dataVar', async () => {
    const fieldName = 'field';
    const args = {input: 123};
    const context = {store: mockFirestore()};
    const rootType = FirestoreReferenceType.Document;
    const mutationType = FirestoreMutationType.Update;
    const directives = {mutation: {rootType, mutationType}};
    const result = {};
    const ref = mockDocRef({update: jest.fn()});
    refForPathMock.mockImplementation(() => ref);
    resolveDocQueryMock.mockImplementation(() => result);

    expect(
      await mutationResolver(
        fieldName,
        {},
        args,
        context as any,
        {
          directives,
        } as any,
      ),
    ).toBe(result);
    expect(ref.update).toHaveBeenCalledWith(args.input);
    expect(refForPathMock).toHaveBeenCalledWith(
      fieldName,
      rootType,
      context.store,
    );
    expect(resolveDocQueryMock).toHaveBeenCalledWith(
      ref,
      fieldName,
      context,
      directives.mutation,
    );
  });

  it('returns the doc id for a delete mutation', async () => {
    const fieldName = 'field';
    const context = {store: mockFirestore()};
    const directives = {
      mutation: {
        rootType: FirestoreReferenceType.Document,
        mutationType: FirestoreMutationType.Delete,
      },
    };
    const __typename = 'Type';
    const id = 'id';
    const ref = {
      __proto__: firestore.DocumentReference.prototype,
      id,
      delete: jest.fn(() => Promise.resolve()),
    };
    refForPathMock.mockImplementation(() => ref);
    resolveTypenameMock.mockImplementation(() => __typename);

    expect(
      await mutationResolver(
        fieldName,
        {},
        {},
        context as any,
        {
          directives,
        } as any,
      ),
    ).toMatchObject({
      __typename,
      id,
    });
    expect(ref.delete).toHaveBeenCalled();
    expect(resolveTypenameMock).toHaveBeenCalledWith({}, fieldName);
  });

  it.todo('returns the result of resolveDocQuery for mutation directives');
  it.todo(
    'returns the result of resolveSnapshot when there is no mutation directive',
  );
  it.todo('can use a path in the directive that overrides the fieldName');
});

describe('resolveMutation()', () => {
  it('throws a MutationError for an add mutation if the ref is not a collection', () => {
    expect(
      resolveMutation(
        {__proto__: firestore.DocumentReference.prototype} as any,
        {},
        {mutationType: FirestoreMutationType.Add} as any,
      ),
    ).toReject();
  });

  it('throws an error for a delete mutation if the ref is not a document', () => {
    expect(
      resolveMutation(
        {__proto__: firestore.CollectionReference.prototype} as any,
        {},
        {mutationType: FirestoreMutationType.Delete} as any,
      ),
    ).toReject();
  });

  it('throws an error for a set mutation if the ref is not a document', () => {
    expect(
      resolveMutation(
        {__proto__: firestore.CollectionReference.prototype} as any,
        {},
        {mutationType: FirestoreMutationType.Set} as any,
      ),
    ).toReject();
  });

  it('throws an error for an update mutation if the ref is not a document', () => {
    expect(
      resolveMutation(
        {__proto__: firestore.CollectionReference.prototype} as any,
        {},
        {mutationType: FirestoreMutationType.Update} as any,
      ),
    ).toReject();
  });

  it('throws a MutationError for an add mutation if there is no data', () => {
    expect(
      resolveMutation(
        {__proto__: firestore.CollectionReference.prototype} as any,
        undefined,
        {mutationType: FirestoreMutationType.Add} as any,
      ),
    ).toReject();
  });

  it('throws a MutationError for a set mutation if there is no data', () => {
    expect(
      resolveMutation(
        {__proto__: firestore.DocumentReference.prototype} as any,
        undefined,
        {mutationType: FirestoreMutationType.Set} as any,
      ),
    ).toReject();
  });

  it('throws a MutationError for an update mutation if there is no data', () => {
    expect(
      resolveMutation(
        {__proto__: firestore.DocumentReference.prototype} as any,
        undefined,
        {mutationType: FirestoreMutationType.Update} as any,
      ),
    ).toReject();
  });

  it('adds a document to a collection with an add mutation', async () => {
    const doc = {};
    const ref = {
      __proto__: firestore.CollectionReference.prototype,
      add: jest.fn(() => doc),
    };
    const data = {};

    expect(
      await resolveMutation(ref as any, data, {
        mutationType: FirestoreMutationType.Add,
      } as any),
    ).toBe(doc);
    expect(ref.add).toHaveBeenCalledWith(data);
  });

  it('deletes a document ref with a delete mutation', async () => {
    const ref = {
      __proto__: firestore.DocumentReference.prototype,
      delete: jest.fn(),
    };

    expect(
      await resolveMutation(ref as any, {}, {
        mutationType: FirestoreMutationType.Delete,
      } as any),
    ).toBe(ref);
    expect(ref.delete).toHaveBeenCalled();
  });

  it('sets a document ref with a set mutation', async () => {
    const ref = {
      __proto__: firestore.DocumentReference.prototype,
      set: jest.fn(),
    };
    const data = {};

    expect(
      await resolveMutation(ref as any, data, {
        mutationType: FirestoreMutationType.Set,
      } as any),
    ).toBe(ref);
    expect(ref.set).toHaveBeenCalledWith(data, expect.anything());
  });

  it('merges a document ref with a set mutation', async () => {
    const ref = {
      __proto__: firestore.DocumentReference.prototype,
      set: jest.fn(),
    };
    const merge = true;
    const data = {};

    await resolveMutation(ref as any, data, {
      merge,
      mutationType: FirestoreMutationType.Set,
    } as any);

    expect(ref.set).toHaveBeenCalledWith(data, {merge});
  });

  it('merges specific fields of a document ref with a set mutation', async () => {
    const ref = {
      __proto__: firestore.DocumentReference.prototype,
      set: jest.fn(),
    };
    const mergeFields = ['field'];
    const data = {};

    await resolveMutation(ref as any, data, {
      mergeFields,
      mutationType: FirestoreMutationType.Set,
    } as any);

    expect(ref.set).toHaveBeenCalledWith(data, {merge: true, mergeFields});
  });

  it('updates a document ref with an update mutation', async () => {
    const ref = {
      __proto__: firestore.DocumentReference.prototype,
      update: jest.fn(),
    };
    const data = {};

    expect(
      await resolveMutation(ref as any, data, {
        mutationType: FirestoreMutationType.Update,
      } as any),
    ).toBe(ref);
    expect(ref.update).toHaveBeenCalledWith(data);
  });
});

describe('MutationError', () => {
  it('has a message that starts with Invalid mutation', () => {
    expect(new MutationError('')).toMatchObject({
      message: expect.stringMatching(/^Invalid mutation/),
    });
  });

  it('has a message ending in the constructor param', () => {
    const message = 'testing';
    expect(new MutationError(message)).toMatchObject({
      message: expect.stringMatching(new RegExp(`${message}$`)),
    });
  });
});
