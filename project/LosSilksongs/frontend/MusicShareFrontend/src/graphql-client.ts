import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

// Obtén el endpoint del GraphQL desde la variable global inyectada
const getGraphQLEndpoint = (): string => {
  // En desarrollo, usa vite.config.ts (dev server)
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5173/graphql';
  }
  
  // En producción, intenta usar window.__ENV__.GRAPHQL_ENDPOINT
  if (typeof window !== 'undefined' && (window as any).__ENV__?.GRAPHQL_ENDPOINT) {
    return (window as any).__ENV__.GRAPHQL_ENDPOINT;
  }
  
  // Fallback a /graphql si no se encuentra configuración
  return '/graphql';
};

const httpLink = new HttpLink({
  uri: getGraphQLEndpoint(),
  credentials: 'include', // Envía cookies si es necesario
});

// Middleware para loguear requests en desarrollo
const logLink = new ApolloLink((operation, forward) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Executing GraphQL operation: ${operation.operationName}`);
    console.log(`GraphQL Endpoint: ${getGraphQLEndpoint()}`);
  }
  return forward(operation);
});

const client = new ApolloClient({
  link: logLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
