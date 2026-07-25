import type z from "zod";

export class AuthenticationError extends Error {
  // Add custom metadata properties
  public readonly code: string;
  public readonly message = "Authentication Failed"
  public readonly statusCode = 401

  constructor() {
    // Call the base Error constructor
    super();

    // Set the error name to the class name instead of "Error"
    this.name = 'AuthenticationError';
    this.code = 'AUTHENTICATION_FAILED';

    // Explicitly restore the correct prototype chain
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}


export class InternalServerError extends Error {
  // Add custom metadata properties
  public readonly code: string;
  public readonly message = "Internal Server Error"
  public readonly statusCode = 500 

  constructor() {
    // Call the base Error constructor
    super();

    // Set the error name to the class name instead of "Error"
    this.name = 'InternalServerError';
    this.code = 'INTERNAL_SERVER_ERROR';

    // Explicitly restore the correct prototype chain
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}


export class ResponseSchemaError extends Error {
  // Add custom metadata properties
  public readonly code: string;

  constructor(err: z.ZodError) {
    // Call the base Error constructor
    super();

    // Set the error name to the class name instead of "Error"
    this.name = 'ResponseSchemaError';
    this.code = 'RESPONSE_SCHEMA_FAILED';
    this.message = err.message

    // Explicitly restore the correct prototype chain
    Object.setPrototypeOf(this, ResponseSchemaError.prototype);
  }
}