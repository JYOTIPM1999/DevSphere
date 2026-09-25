import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DevSphere API",
      version: "1.0.0",
      description: "API documentation for the DevSphere social platform.",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Tells Swagger to look for JSDoc comments in these files
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
export const setupSwagger = (app) => {
  // Mounts the Swagger UI dashboard at the /api-docs endpoint
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
