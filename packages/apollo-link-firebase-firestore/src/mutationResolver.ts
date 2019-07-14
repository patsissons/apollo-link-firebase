import {firestore} from 'firebase/app';
import {
  refForPath,
  resolveDocQuery,
  resolveSnapshot,
  resolveTypename,
} from './queryResolver';
import {
  FirestoreExecInfo,
  FirestoreMutationType,
  FirestoreReference,
  FirestoreReferenceType,
  MutationDirectiveArgs,
  MutationResolverContext,
  ResolverRoot,
} from './types';

export async function mutationResolver(
  fieldName: string,
  {__typename, snapshot}: ResolverRoot,
  args: Record<string, any> | null,
  context: MutationResolverContext,
  info: FirestoreExecInfo,
) {
  const {store} = context;
  const {directives} = info;

  if (directives && directives.mutation) {
    const {
      dataArg,
      dataVar = 'input',
      mutationType,
      path = fieldName,
      rootType,
      ...directive
    } = directives.mutation;

    if (!mutationType) {
      throw new MutationError('mutationType is required');
    }

    const data: Record<string, any> | undefined =
      dataArg || (args && args[dataVar]);

    const docRef = await resolveMutation(
      mutationRefForPath(path, rootType, store, mutationType, data),
      data,
      directives.mutation,
    );

    if (mutationType === FirestoreMutationType.Delete) {
      return {
        __typename: resolveTypename(directive, fieldName),
        id: docRef.id,
      };
    }

    return resolveDocQuery(docRef, fieldName, context, directives.mutation);
  } else if (__typename && snapshot) {
    return resolveSnapshot(
      fieldName,
      {__typename, snapshot},
      args,
      context,
      info,
    );
  }

  throw new MutationError('no snapshot or mutation directive');
}

export function mutationRefForPath(
  path: string,
  rootType: FirestoreReferenceType,
  store: firestore.Firestore,
  mutationType: FirestoreMutationType,
  data: Record<string, any> | undefined,
) {
  const ref = refForPath(path, rootType, store);

  if (
    ref instanceof firestore.CollectionReference &&
    mutationType !== FirestoreMutationType.Add
  ) {
    if (!data) {
      throw new MutationError('mutation requires a valid dataArg or dataVar');
    }

    if (typeof data.id !== 'string') {
      throw new MutationError(
        'mutation requires a valid id through dataArg or dataVar',
      );
    }

    return ref.doc(data.id);
  }

  return ref;
}

export async function resolveMutation(
  mutationRef: FirestoreReference,
  data: Record<string, any> | undefined,
  {merge, mergeFields, mutationType}: MutationDirectiveArgs,
) {
  if (mutationRef instanceof firestore.CollectionReference) {
    if (mutationType !== FirestoreMutationType.Add) {
      throw new MutationError(
        'collection reference only supports the add mutation',
      );
    }

    if (!data) {
      throw new MutationError('mutation requires a valid dataArg or dataVar');
    }

    return mutationRef.add(data);
  }

  if (mutationType === FirestoreMutationType.Add) {
    throw new MutationError(
      'document reference does not support the add mutation',
    );
  }

  if (mutationType === FirestoreMutationType.Delete) {
    await mutationRef.delete();

    return mutationRef;
  }

  if (!data) {
    throw new MutationError('mutation requires a valid dataArg or dataVar');
  }

  switch (mutationType) {
    case FirestoreMutationType.Set:
      await mutationRef.set(data, {
        merge: Boolean(merge || mergeFields),
        mergeFields,
      });
      break;
    case FirestoreMutationType.Update:
      await mutationRef.update(data);
      break;
  }

  return mutationRef;
}

export class MutationError extends Error {
  constructor(message: string) {
    // istanbul ignore next
    super(`Invalid mutation: ${message}`);
  }
}
