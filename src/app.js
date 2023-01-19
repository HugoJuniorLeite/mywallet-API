import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi';
import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid";

dotenv.config();


const app = express()
;
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.REACT_APP_API_URL);
let db;

mongoClient.connect()
    .then(() => {
        db = mongoClient.db()
    });

app.post("/", async (req, res) => {
    const { email, password } = req.headers;

    const userSchema = joi.object({
        email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'br'] } }).required(),
        password: joi.string().min(6).max(18).required()
    });

    const validation = userSchema.validate({ email, password }, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    };

    try {

        const user = await db.collection("users").findOne({ email });

        if (user && bcrypt.compareSync(password, user.password)) {
            const token = uuid();
            
            await db.collection("sessions"),insertOne({
                userId: user._id,
                token
            })
            res.send(token)
            
        } else {
            return res.status(422).send("e-mail ou senha incorretos")
        }

        return res.sendStatus(201);

    } catch (err) { return res.status(500).send(err.message) }
});

app.post("/cadastro", async (req, res) => {
    const { username, email, password, repeatPassword } = req.body;

    const userSchema = joi.object({

        username: joi.string().required(),
        email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'br'] } }).required(),
        password: joi.string().min(6).max(18).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
        repeatPassword: joi.ref('password')
    });

    const validation = userSchema.validate({ username, email, password, repeatPassword }, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    };

    try {

        const passwordHash = bcrypt.hashSync(password, 10);

        await db.collection("users").insertOne({
            username: username,
            email: email,
            password: passwordHash,
        });
        return res.sendStatus(201);

    } catch (err) { return res.status(500).send(err.message) };

});

const PORT = process.env.PORT_SERVER;

app.listen(PORT, () => { console.log(`Servidor rodando na porta ${PORT}`) });