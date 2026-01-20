declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css'; 

declare module 'near-api-js' {
  export * from 'near-api-js/lib/index.js';
}
