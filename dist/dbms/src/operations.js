import { prisma } from "./client";
import { userSchema, bossSchema, organizerSchema, adventureSchema, eventSchema, updateWhitelists, } from "./types";
// Schema mapping
const schemaMap = {
    users: userSchema,
    bosses: bossSchema,
    organizers: organizerSchema,
    adventures: adventureSchema,
    events: eventSchema,
};
// Prisma delegate mapping
const delegateMap = {
    users: prisma.user,
    bosses: prisma.boss,
    organizers: prisma.organizer,
    adventures: prisma.adventure,
    events: prisma.event,
};
// Helper function to remap user data
function remapUserData(input) {
    const { star_score, setting_1, setting_2, ...rest } = input;
    return {
        ...rest,
        star_score: star_score ?? 0,
        setting_1: setting_1 ?? false,
        setting_2: setting_2 ?? false,
    };
}
/**
 * Insert a new record into the specified entity table
 */
export async function insertRecord(entity, data) {
    try {
        const schema = schemaMap[entity];
        const delegate = delegateMap[entity];
        if (!schema || !delegate) {
            throw new Error(`Unknown entity: ${entity}`);
        }
        // Validate input data
        const validatedData = schema.parse(data);
        // Special handling for users
        const processedData = entity === "users" ? remapUserData(validatedData) : validatedData;
        // Create record
        const result = await delegate.create({ data: processedData });
        return result;
    }
    catch (error) {
        throw new Error(`Failed to insert ${entity}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Update an existing record in the specified entity table
 */
export async function updateRecord(entity, id, data) {
    try {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Invalid id. Must be a positive integer.");
        }
        const delegate = delegateMap[entity];
        const allowedFields = updateWhitelists[entity];
        if (!delegate || !allowedFields) {
            throw new Error(`Unknown entity: ${entity}`);
        }
        // Filter data to only include allowed fields
        const filteredData = {};
        for (const [key, value] of Object.entries(data)) {
            if (allowedFields.includes(key)) {
                filteredData[key] = value;
            }
        }
        if (Object.keys(filteredData).length === 0) {
            throw new Error("No valid fields provided to update");
        }
        // Special handling for timing field
        if (filteredData.timing) {
            filteredData.timing = new Date(filteredData.timing);
        }
        // Update record
        const result = await delegate.update({
            where: { id },
            data: filteredData,
        });
        return result;
    }
    catch (error) {
        throw new Error(`Failed to update ${entity}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Delete a record from the specified entity table
 */
export async function deleteRecord(entity, id) {
    try {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Invalid id. Must be a positive integer.");
        }
        const delegate = delegateMap[entity];
        if (!delegate) {
            throw new Error(`Unknown entity: ${entity}`);
        }
        // Delete record
        const result = await delegate.delete({ where: { id } });
        return result;
    }
    catch (error) {
        throw new Error(`Failed to delete ${entity}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Find a record by ID
 */
export async function findRecord(entity, id) {
    try {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Invalid id. Must be a positive integer.");
        }
        const delegate = delegateMap[entity];
        if (!delegate) {
            throw new Error(`Unknown entity: ${entity}`);
        }
        const result = await delegate.findUnique({ where: { id } });
        return result;
    }
    catch (error) {
        throw new Error(`Failed to find ${entity}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Find multiple records with optional filtering
 */
export async function findRecords(entity, options) {
    try {
        const delegate = delegateMap[entity];
        if (!delegate) {
            throw new Error(`Unknown entity: ${entity}`);
        }
        const result = await delegate.findMany(options || {});
        return result;
    }
    catch (error) {
        throw new Error(`Failed to find ${entity}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=operations.js.map