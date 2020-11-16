import mongoose, { Schema } from "mongoose";

export const Handshake = mongoose.model("Handshake", new Schema({
    name: String,
    email: String,
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    createdAt: { type: Date, default: Date.now() }
}));