import {createFirestoreLink, FirestoreLink} from '../FirestoreLink';

describe('createFirestoreLink()', () => {
  const mockStore: any = {};

  it('creates a firestore link', () => {
    expect(createFirestoreLink(mockStore)).toBeInstanceOf(FirestoreLink);
  });
});
