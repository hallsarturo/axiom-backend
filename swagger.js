import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Axiom Backend API',
    version: '0.1.0',
    description: 'API documentation for Axiom Backend',
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.axiomlab.space' 
        : 'https://localhost:4010',
      description: process.env.NODE_ENV === 'production' 
        ? 'Production server' 
        : 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./api/**/*.js'], // Path to the API docs (JSDoc comments)
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;