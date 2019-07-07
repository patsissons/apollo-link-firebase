import {
  ApolloLink,
  FetchResult,
  NextLink,
  Observable,
  Operation,
} from 'apollo-link';
import {addTypenameToDocument, getMainDefinition} from 'apollo-utilities';
import {firestore} from 'firebase/app';
import 'firebase/firestore';
import {DocumentNode, OperationTypeNode} from 'graphql';
import {OperationDefinitionNode, visit} from 'graphql/language';
import {Resolver} from 'graphql-anywhere';
import {graphql} from 'graphql-anywhere/lib/async';
import {mutationResolver} from './mutationResolver';
import {queryResolver} from './queryResolver';
import {
  OnSnapshotSubscriber,
  QueryResolverContext,
  ResolverRoot,
} from './types';

type RequestContext = ReturnType<typeof createRequestContext>;

export class FirestoreLink extends ApolloLink {
  constructor(protected readonly store: firestore.Firestore) {
    super();
  }

  public request(operation: Operation, forward?: NextLink) {
    const context = requestContext(this.store, operation);

    if (isFirestoreQuery(context)) {
      return this.observeQuery(operation, context);
    }

    if (forward) {
      return forward(operation);
    }

    return null;
  }

  protected observeQuery(
    {variables, query}: Operation,
    {context, mainDefinition, queryWithTypename, resolverRoot}: RequestContext,
  ): Observable<FetchResult> {
    return new Observable((observer) => {
      const resolver = resolverForOperationType(mainDefinition.operation);
      const subscribe = hasSubscribeDirective(query);
      let subscribed = false;

      function refreshGraphQL(
        single: boolean,
        onSnapshot?: OnSnapshotSubscriber,
      ) {
        debugLog(
          `invoking GraphQL ${mainDefinition.operation}${
            single ? ' Once' : ''
          }${mainDefinition.name && `: ${mainDefinition.name.value}`}`,
        );

        graphql(
          resolver,
          queryWithTypename,
          resolverRoot,
          {...context, onSnapshot},
          variables,
        )
          .then((data) => {
            if (!data) {
              throw new Error('null');
            }

            observer.next({data});

            if (single) {
              observer.complete();
            }

            // wait until after the first response to enable the subscription
            subscribed = true;
          })
          .catch((err) => {
            if (err.name === 'AbortError') {
              return;
            }

            if (err.result && err.result.errors) {
              observer.next(err.result);
            }

            observer.error(err);
          });
      }

      refreshGraphQL(
        !subscribe,
        subscribe
          ? {
              ...observer,
              next(snapshot) {
                debugLog('snapshot updated', snapshot);

                // istanbul ignore else
                if (subscribed) {
                  refreshGraphQL(false);
                }
              },
            }
          : undefined,
      );
    });
  }
}

// istanbul ignore next
function debugLog(...args: any[]) {
  // eslint-disable-next-line no-process-env
  if (typeof process === 'object' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

function resolverForOperationType(operationType: OperationTypeNode): Resolver {
  switch (operationType) {
    case 'query':
    case 'subscription':
      return queryResolver;
    case 'mutation':
      return mutationResolver;
    // istanbul ignore next
    default:
      throw new Error(`${operationType} not supported`);
  }
}

function isFirestoreQuery(
  context: RequestContext | null,
): context is RequestContext {
  return Boolean(
    context &&
      context.mainDefinition.directives &&
      context.mainDefinition.directives.some(({name: {value}}) =>
        ['query', 'mutation'].includes(value),
      ),
  );
}

function requestContext(store: firestore.Firestore, {query}: Operation) {
  const mainDefinition = getMainDefinition(query);

  if (mainDefinition.kind === 'OperationDefinition') {
    return createRequestContext(store, query, mainDefinition);
  }

  return null;
}

function createRequestContext(
  store: firestore.Firestore,
  query: DocumentNode,
  mainDefinition: OperationDefinitionNode,
) {
  return {
    context: {
      store,
      fields: {},
    } as QueryResolverContext,
    mainDefinition,
    queryWithTypename: addTypenameToDocument(query),
    resolverRoot: {} as ResolverRoot,
  };
}

function hasSubscribeDirective(query: DocumentNode) {
  let subscribe = false;

  visit(query, {
    Directive(directive) {
      // istanbul ignore else
      if (
        !subscribe &&
        directive.name.value === 'query' &&
        directive.arguments &&
        directive.arguments.some(
          ({name, value}) =>
            name.value === 'subscribe' &&
            value.kind === 'BooleanValue' &&
            value.value,
        )
      ) {
        subscribe = true;
      }
    },
  });

  return subscribe;
}

export function createFirestoreLink(store: firestore.Firestore) {
  return new FirestoreLink(store);
}
