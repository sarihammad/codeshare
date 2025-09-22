/**
 * This file is auto-generated from the OpenAPI specification.
 * Run `npm run generate-types` to regenerate this file.
 */

export interface paths {
  "/api/auth/register": {
    post: operations["registerUser"];
  };
  "/api/auth/login": {
    post: operations["loginUser"];
  };
  "/api/auth/logout": {
    post: operations["logoutUser"];
  };
  "/api/auth/me": {
    get: operations["getCurrentUser"];
  };
  "/api/auth/refresh": {
    post: operations["refreshToken"];
  };
  "/api/rooms": {
    get: operations["getRooms"];
    post: operations["createRoom"];
  };
  "/api/rooms/{roomId}": {
    get: operations["getRoom"];
    put: operations["updateRoom"];
    delete: operations["deleteRoom"];
  };
  "/api/rooms/{roomId}/snapshot": {
    post: operations["createSnapshot"];
  };
  "/api/rooms/{roomId}/snapshots": {
    get: operations["getSnapshots"];
  };
}

export interface components {
  schemas: {
    AuthRequest: {
      email: string;
      password: string;
    };
    RegisterRequest: {
      email: string;
      password: string;
      name: string;
    };
    AuthResponse: {
      message: string;
      token?: string;
      refreshToken?: string;
    };
    User: {
      id: string;
      email: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    };
    Room: {
      id: string;
      name: string;
      description?: string;
      ownerId: string;
      createdAt: string;
      updatedAt: string;
    };
    CreateRoomRequest: {
      name: string;
      description?: string;
    };
    Snapshot: {
      id: string;
      roomId: string;
      content: string;
      createdAt: string;
    };
    CreateSnapshotRequest: {
      content: string;
    };
    Error: {
      error: string;
      message?: string;
      details?: Record<string, unknown>;
    };
  };
}

export interface operations {
  registerUser: {
    parameters: {};
    requestBody: {
      content: {
        "application/json": components["schemas"]["RegisterRequest"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["AuthResponse"];
        };
      };
      400: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
      409: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
    };
  };
  loginUser: {
    parameters: {};
    requestBody: {
      content: {
        "application/json": components["schemas"]["AuthRequest"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["AuthResponse"];
        };
      };
      401: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
    };
  };
  logoutUser: {
    parameters: {};
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["AuthResponse"];
        };
      };
    };
  };
  getCurrentUser: {
    parameters: {};
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
      401: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
    };
  };
  refreshToken: {
    parameters: {};
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["AuthResponse"];
        };
      };
      401: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
    };
  };
  getRooms: {
    parameters: {};
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["Room"][];
        };
      };
    };
  };
  createRoom: {
    parameters: {};
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateRoomRequest"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": components["schemas"]["Room"];
        };
      };
      400: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
    };
  };
  getRoom: {
    parameters: {
      path: {
        roomId: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["Room"];
        };
      };
      404: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
    };
  };
  updateRoom: {
    parameters: {
      path: {
        roomId: string;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateRoomRequest"];
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["Room"];
        };
      };
      400: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
      404: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
    };
  };
  deleteRoom: {
    parameters: {
      path: {
        roomId: string;
      };
    };
    responses: {
      204: {
        content: never;
      };
      404: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
    };
  };
  createSnapshot: {
    parameters: {
      path: {
        roomId: string;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateSnapshotRequest"];
      };
    };
    responses: {
      201: {
        content: {
          "application/json": components["schemas"]["Snapshot"];
        };
      };
      400: {
        content: {
          "application/json": components["schemas"]["Error"];
        };
      };
    };
  };
  getSnapshots: {
    parameters: {
      path: {
        roomId: string;
      };
    };
    responses: {
      200: {
        content: {
          "application/json": components["schemas"]["Snapshot"][];
        };
      };
    };
  };
}

// Type helpers for easier usage
export type ApiRequest<T extends keyof operations> = operations[T]["requestBody"]["content"]["application/json"];
export type ApiResponse<T extends keyof operations> = operations[T]["responses"][200]["content"]["application/json"];
export type ApiError<T extends keyof operations> = operations[T]["responses"][400 | 401 | 404 | 409]["content"]["application/json"];
