/**
 * Create a persisted user. Schema requires a unique username,
 * so we derive it from email's local part or the name.
 * Note: dob is not stored on User model; it exists on PendingUser only.
 */
export declare function createUser(name: string, phone: string, email: string, _dob: Date, gender: string, isNonBinary: boolean, pool: any): Promise<any>;
export declare function createPendingUser(name: string, phone: string, email: string, dob: string, gender: string, requestId: string, pool: any): Promise<string>;
//# sourceMappingURL=auth-helpers.d.ts.map