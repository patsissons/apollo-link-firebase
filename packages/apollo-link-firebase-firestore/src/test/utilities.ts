// istanbul ignore file

import {firestore} from 'firebase/app';

export function mockFirestore(props: Partial<firestore.Firestore> = {}) {
  return {
    collection() {
      return mockCollectionRef();
    },
    doc() {
      return mockDocRef();
    },
    ...props,
  } as firestore.Firestore;
}

export function mockDocRef(props: Partial<firestore.DocumentReference> = {}) {
  const ref = {
    collection() {
      return mockCollectionRef();
    },
    delete() {
      return Promise.resolve();
    },
    firestore: mockFirestore(),
    get() {
      return Promise.resolve(mockDocSnapshot());
    },
    id: 'id',
    isEqual() {
      return true;
    },
    onSnapshot() {
      return () => {};
    },
    parent: mockCollectionRef(),
    path: 'path',
    set() {
      return Promise.resolve();
    },
    update() {
      return Promise.resolve();
    },
    ...props,
  } as firestore.DocumentReference;

  return ref;
}

export function mockDocSnapshot(
  props: Partial<firestore.QueryDocumentSnapshot> = {},
) {
  return {
    data() {
      return {};
    },
    exists: true,
    get() {
      return {};
    },
    id: 'id',
    isEqual() {
      return true;
    },
    metadata: {
      fromCache: false,
      hasPendingWrites: false,
      isEqual() {
        return true;
      },
    },
    ref: mockDocRef(),
    ...props,
  } as firestore.QueryDocumentSnapshot;
}

export function mockCollectionRef(
  props: Partial<firestore.CollectionReference> = {},
) {
  function stub() {
    return ref;
  }

  const ref = {
    add() {
      return Promise.resolve(mockDocRef());
    },
    doc() {
      return mockDocRef();
    },
    endAt: stub,
    endBefore: stub,
    firestore: mockFirestore(),
    get() {
      return Promise.resolve(mockQuerySnapshot());
    },
    id: 'id',
    isEqual() {
      return true;
    },
    limit: stub,
    onSnapshot() {
      return () => {};
    },
    orderBy: stub,
    parent: null,
    path: 'path',
    startAfter: stub,
    startAt: stub,
    where: stub,
    ...props,
  } as firestore.CollectionReference;

  return ref;
}

export function mockQuerySnapshot(
  props: Partial<firestore.QuerySnapshot> = {},
) {
  return {
    docChanges() {
      return [];
    },
    docs: [],
    empty: true,
    forEach() {},
    isEqual() {
      return true;
    },
    metadata: {
      fromCache: false,
      hasPendingWrites: false,
      isEqual() {
        return true;
      },
    },
    query: mockCollectionRef(),
    size: 0,
    ...props,
  } as firestore.QuerySnapshot;
}
