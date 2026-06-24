/**
 * 400 Bad Request
 *
 * The server cannot or will not process the request due to something that is perceived to be a client error.
 */
export class BadRequestError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "BadRequestError";
  }
}

/**
 * 401 Unauthorized
 *
 * The client must authenticate itself to get the requested response.
 */
export class UnauthorizedError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "UnauthorizedError";
  }
}

/**
 * 403 Forbidden
 *
 * The client does not have access rights to the content.
 */
export class ForbiddenError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ForbiddenError";
  }
}

/**
 * 404 Not Found
 *
 * The server cannot find the requested resource.
 */
export class NotFoundError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NotFoundError";
  }
}
