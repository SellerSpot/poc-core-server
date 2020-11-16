import express from "express";
import morgan from "morgan";
import { dbConfig } from "./config";
import lodash from "lodash";
import cors from "cors";

// constants
const PORT = 5000;
const app = express();

// global configurations
dbConfig();

// middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

// routes
app.get("/", (req, res) => res.send("Sellerspot core api server"));

app.post("/register", async (req, res) => {
    const db = await global.db;
    const Tenant = await db.model("Tenant");
    const alreadyExistCheck = await checkTenantIfAlreadyExist(req.body);
    if (alreadyExistCheck.status) return res.send(alreadyExistCheck);
    const tenant = new Tenant({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
    });
    tenant.save((err, value) => {
        if (err) res.send({ status: false, payload: err.message })
        setTimeout(() => {
            createAndHandshakeTenantDB(value)
        });
        res.send({
            status: true,
            payload: value
        })
    });
});

app.post("/login", async (req, res) => {
    const db = await global.db;
    const Tenant = await db.model("Tenant");
    Tenant.findOne({ email: req.body.email, password: req.body.password }, (err, value) => {
        if (err) res.send(err)
        else {
            res.send({ status: !!value, payload: value })
        }
    })
});

app.post("/installapp", async (req, res) => {
    const db = await global.db;
    const Tenant = await db.model("Tenant");
    const tenant = await Tenant.findOne({ _id: req.body.uId });
    if (tenant) {
        const app = {
            name: req.body.appId,
            configurations: req.body.configurations,
            installedAt: Date.now()
        };
        if (!!!lodash.find(tenant.installedApps, { name: req.body.appId })) {
            const posInstance = await createPosInstance({ uId: req.body.uId, name: req.body.configurations.name });
            tenant.installedApps.push({
                ...app,
                posInstanceId: posInstance.payload._id
            });
            tenant.save((err, value) => {
                if (err) res.send({ status: false, payload: err.message })
                res.send({
                    status: true,
                    payload: app
                })
            });
        } else {
            res.send({
                status: true,
                payload: app
            })
        }
    } else {
        res.send({
            status: false,
            payload: null
        })
    }
});

app.get("/installedapps", async (req, res) => {
    const db = await global.db;
    const Tenant = await db.model("Tenant");
    Tenant.findOne({ _id: req.query.uid }, { installedApps: true }, (err, value) => {
        if (err) res.send(err)
        else {
            res.send({ status: !!value, payload: value?.installedApps })
        }
    })
})

app.get("/availableapps", (req, res) => {
    res.send({
        status: true,
        payload: [{
            name: "POS",
            configurations: {
                dashboardUrl: '/dashboard/yourapps/pos',
            }
        },
        {
            name: "ECOM",
            configurations: {
                dashboardUrl: '/dashboard/yourapps/ecom',
            }
        }]
    })
})

app.get("/posconfigurations", async (req, res) => {
    const db = await global.db;
    const Tenant = await db.model("Tenant");
    Tenant.findOne({ _id: req.query.uid, 'installedApps.name': 'POS' }, { 'installedApps.$': true }, (err, value) => {
        if (err) res.send(err)
        else {
            res.send({ status: !!value, payload: { ...(value?.installedApps?.[0]?._doc), baseDeploymentUrl: 'pos.sellerspotdev.tech' } })
        }
    })
})

app.get("/validatetenant", async (req, res) => {
    const db = await global.db;
    const Tenant = await db.model("PosInstance");
    Tenant.findOne({ name: req.query.tenant }, (err, value) => {
        if (err) res.send({
            status: false,
            payload: err
        })
        else {
            res.send({ status: !!value, payload: value })
        }
    })
})

// create pos instance - used later to check if the instance is availble or not
const createPosInstance = async (body) => {
    try {
        const db = await global.db;
        const PosInstance = await db.model("PosInstance");
        const posInstance = new PosInstance({ name: body.name, tenantId: body.uId });
        const response = await posInstance.save();
        return { status: !!response, payload: response }
    } catch (error) {
        return {
            status: false,
            payload: null
        }
    }
}

// tenatnt already exist check
const checkTenantIfAlreadyExist = async (body) => {
    try {
        const db = await global.db;
        const Tenant = await db.model("Tenant");
        const tenant = await Tenant.findOne({ email: body.email });
        return { status: !!tenant, payload: tenant }
    } catch (error) {
        return {
            status: false,
            payload: null
        }
    }
}

// asynchrous tenantdb handshake code goes here
const createAndHandshakeTenantDB = async (tenant) => {
    const coreDb = await global.db;
    const db = await coreDb.useDb(tenant.id);
    const Handshake = await db.model("Handshake");
    const handshake = new Handshake({
        name: tenant.name,
        email: tenant.email,
        tenantId: tenant.id,
    });
    handshake.save((err, value) => {
        if (err) console.log("Error creating database for tenant", tenant.name, err.message);
        else console.log("Success creating database for tenant", tenant.name, value.id);
    })
}

// listeners
app.listen(PORT, () => {
    console.log("Server started at port ", PORT);
})