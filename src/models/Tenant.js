import mongoose, { Schema } from "mongoose";

export const Tenant = mongoose.model("Tenant", new Schema({
    name: String,
    password: String,
    email: String,
    installedApps: [{
        name: String,
        configurations: Object,
        installedAt: Date,
        posInstanceId: { type: Schema.Types.ObjectId, ref: 'PosInstance' },
    }]
}));