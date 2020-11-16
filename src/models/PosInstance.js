import mongoose, { Schema } from "mongoose";

export const PosInstance = mongoose.model("PosInstance", new Schema({
    name: String,
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    createdAt: { type: Date, default: Date.now() }
}));