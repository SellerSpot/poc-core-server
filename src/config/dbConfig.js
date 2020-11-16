import mongoose from "mongoose";
import { configObject } from '.';
import * as models from "../models";

export const dbConfig = () => {
    let coreDbConnection = mongoose.createConnection(configObject.dbUrl, { useUnifiedTopology: true, useNewUrlParser: true });
    coreDbConnection.on("error", (error) => console.log("Error Connecting to core Mongo db ", error.message));
    coreDbConnection.once("open", () => console.log("Connected to core mongo db!"));
    global.db = coreDbConnection;
}