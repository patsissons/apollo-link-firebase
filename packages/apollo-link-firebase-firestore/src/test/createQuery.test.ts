import {createQuery} from '../createQuery';
import {
  CollectionQueryDirectiveArgs,
  CollectionDirectiveWhereArgs,
  CollectionDirectiveOrderByArgs,
} from '../types';
import {mockCollectionRef, mockDocRef} from './utilities';

describe('createQuery()', () => {
  const defaultMockArgs: CollectionQueryDirectiveArgs = {};
  const defaultMockFields = {};

  it('returns the input ref if there are no operations', () => {
    const args = {...defaultMockArgs};
    const fields = {...defaultMockFields};
    const ref = mockCollectionRef();

    expect(createQuery(args, fields, ref)).toBe(ref);
  });

  it('returns an input ref derived query if there are any operations', () => {
    const args = {...defaultMockArgs, limit: 123};
    const fields = {...defaultMockFields};
    const ref = mockCollectionRef({limit: jest.fn(() => ref)});

    expect(createQuery(args, fields, ref)).toBe(ref);
  });

  it('applies the endAt operator', () => {
    const args = {...defaultMockArgs, endAt: 'test'};
    const fields = {...defaultMockFields};
    const doc = mockDocRef();
    const ref = mockCollectionRef({
      doc: jest.fn(() => doc),
      endAt: jest.fn(() => ref),
    });
    createQuery(args, fields, ref);

    expect(ref.endAt).toHaveBeenCalledWith(doc);
    expect(ref.doc).toHaveBeenCalledWith(args.endAt);
  });

  it('applies the endBefore operator', () => {
    const args = {...defaultMockArgs, endBefore: 'test'};
    const fields = {...defaultMockFields};
    const doc = mockDocRef();
    const ref = mockCollectionRef({
      doc: jest.fn(() => doc),
      endBefore: jest.fn(() => ref),
    });
    createQuery(args, fields, ref);

    expect(ref.endBefore).toHaveBeenCalledWith(doc);
    expect(ref.doc).toHaveBeenCalledWith(args.endBefore);
  });

  it('applies the startAfter operator', () => {
    const args = {...defaultMockArgs, startAfter: 'test'};
    const fields = {...defaultMockFields};
    const doc = mockDocRef();
    const ref = mockCollectionRef({
      doc: jest.fn(() => doc),
      startAfter: jest.fn(() => ref),
    });
    createQuery(args, fields, ref);

    expect(ref.startAfter).toHaveBeenCalledWith(doc);
    expect(ref.doc).toHaveBeenCalledWith(args.startAfter);
  });

  it('applies the startAt operator', () => {
    const args = {...defaultMockArgs, startAt: 'test'};
    const fields = {...defaultMockFields};
    const doc = mockDocRef();
    const ref = mockCollectionRef({
      doc: jest.fn(() => doc),
      startAt: jest.fn(() => ref),
    });
    createQuery(args, fields, ref);

    expect(ref.startAt).toHaveBeenCalledWith(doc);
    expect(ref.doc).toHaveBeenCalledWith(args.startAt);
  });

  it('applies the where operator', () => {
    const whereArgs: CollectionDirectiveWhereArgs = {
      fieldPath: 'test',
      op: '==',
      val: '123',
    };
    const args = {...defaultMockArgs, where: [whereArgs]};
    const fields = {...defaultMockFields};
    const ref = mockCollectionRef({where: jest.fn(() => ref)});
    createQuery(args, fields, ref);

    expect(ref.where).toHaveBeenCalledWith(
      whereArgs.fieldPath,
      whereArgs.op,
      whereArgs.val,
    );
  });

  it('can apply the where operator for multiple conditions', () => {
    const whereArgs: CollectionDirectiveWhereArgs[] = [
      {
        fieldPath: 'test1',
        op: '==',
        val: '123',
      },
      {
        fieldPath: 'test2',
        op: '==',
        val: '123',
      },
    ];
    const args = {...defaultMockArgs, where: whereArgs};
    const fields = {...defaultMockFields};
    const ref = mockCollectionRef({where: jest.fn(() => ref)});
    createQuery(args, fields, ref);

    expect(ref.where).toHaveBeenCalledTimes(whereArgs.length);
    expect(ref.where).toHaveBeenNthCalledWith(
      1,
      whereArgs[0].fieldPath,
      whereArgs[0].op,
      whereArgs[0].val,
    );
    expect(ref.where).toHaveBeenNthCalledWith(
      2,
      whereArgs[1].fieldPath,
      whereArgs[1].op,
      whereArgs[1].val,
    );
  });

  it('applies the orderBy operator', () => {
    const orderByArgs: CollectionDirectiveOrderByArgs = {
      direction: 'desc',
      fieldPath: 'test',
    };
    const args = {...defaultMockArgs, orderBy: orderByArgs};
    const fields = {...defaultMockFields};
    const ref = mockCollectionRef({orderBy: jest.fn(() => ref)});
    createQuery(args, fields, ref);

    expect(ref.orderBy).toHaveBeenCalledWith(
      orderByArgs.fieldPath,
      orderByArgs.direction,
    );
  });

  it('applies the limit operator', () => {
    const args = {...defaultMockArgs, limit: 123};
    const fields = {...defaultMockFields};
    const ref = mockCollectionRef({limit: jest.fn(() => ref)});
    createQuery(args, fields, ref);

    expect(ref.limit).toHaveBeenCalledWith(args.limit);
  });

  it('converts a string limit to a number', () => {
    const args = {...defaultMockArgs, limit: '123'};
    const fields = {...defaultMockFields};
    const ref = mockCollectionRef({limit: jest.fn(() => ref)});
    createQuery(args, fields, ref);

    expect(ref.limit).toHaveBeenCalledWith(Number(args.limit));
  });

  it('invokes functional args with exports and ref', () => {
    // functional args are not permitted with the direct API, but can be used
    // in variables that are passed down to the query.
    const limit: any = jest.fn();
    const args = {...defaultMockArgs, limit};
    const fields = {...defaultMockFields};
    const ref = mockCollectionRef();
    createQuery(args, fields, ref);

    expect(limit).toHaveBeenCalledWith({fields, ref});
  });

  it('replaces exports in string collection directive args', () => {
    const args = {...defaultMockArgs, limit: '$fields{test}'};
    const fields = {
      ...defaultMockFields,
      test: '123',
    };
    const ref = mockCollectionRef({limit: jest.fn(() => ref)});
    createQuery(args, fields, ref);

    expect(ref.limit).toHaveBeenCalledWith(Number(fields.test));
  });

  it('replaces exports in object collection directive args for string parameters', () => {
    const whereArgs: CollectionDirectiveWhereArgs = {
      fieldPath: 'test',
      op: '==',
      val: 'foo$fields{test}bar',
    };
    const args = {...defaultMockArgs, where: [whereArgs]};
    const fields = {
      ...defaultMockFields,
      test: '123',
    };
    const ref = mockCollectionRef({where: jest.fn(() => ref)});
    createQuery(args, fields, ref);

    expect(ref.where).toHaveBeenCalledWith(
      whereArgs.fieldPath,
      whereArgs.op,
      `foo${fields.test}bar`,
    );
  });
});
