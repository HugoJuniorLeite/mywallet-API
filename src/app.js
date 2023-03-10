import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi';
import bcrypt from "bcrypt"
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
    .then(() => {
        db = mongoClient.db()
    });

app.post("/sign-in", async (req, res) => {
    const { email, password } = req.body;

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
            console.log(user,"usuario do login")
            await db.collection("sessions").insertOne({
                userId: user._id,
                 token:token 
        })

                return res.status(201).send({ token:token, username:user.username})

        } else {
            return res.status(422).send("e-mail ou senha incorretos")
        }
    } catch (err) { return res.status(500).send(err.message) }
});

app.post("/sign-up", async (req, res) => {
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
        const isuser = await db.collection("users").findOne({ $or: [{ username, email }] })

        if (isuser) {
            return res.status(422).send("Nome de usuario ou e-mail j?? cadastrados")
        }

        const passwordHash = bcrypt.hashSync(password, 10);

        await db.collection("users").insertOne({
            username: username,
            email: email,
            password: passwordHash,
        });
        return res.sendStatus(201);

    } catch (err) { return res.status(500).send(err.message) };

});

app.post("/transactions", async (req, res) => {
    const { price, description, type } = req.body;
    const { authorization } = req.headers
    const token = authorization?.replace("Bearer ", '')

    const transitionSchema = joi.object({
        price: joi.number().required(),
        description: joi.string().min(3).max(30).required(),
        type: joi.string().valid("deposit","outflow").required(),
        token:joi.string().required()
    });

    const validation = transitionSchema.validate({ price, description, type, token }, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    };

    try {

        const user = await db.collection('sessions').findOne({ token })

        if (!user) {
            return res.status(422).send("voc?? n??o possui permiss??o")
        }

        await db.collection('transactions').insertOne({
            userId: user.userId,
            type: type,
            price: price.toFixed(2),
            description: description,
            date: dayjs().format('DD/MM')
        })
        return res.status(201).send('create')

    } catch (err) { return res.status(500).send(err.message) }
})

app.post("/sign-out", async (req, res)=>{
    const { authorization } = req.headers
    const token = authorization?.replace("Bearer ", '')

    try{
        const user = await db.collection('sessions').findOne({ token })

        if (!user) {
            return res.status(422).send("voc?? n??o possui permiss??o")
        }
         await db.collection('sessions').deleteOne({ token: token }).toArray()

        return res.send(home)

    }catch(err){return res.status(422).send(err.message)}
})

app.get("/transactions", async (req, res) => {
    const { authorization } = req.headers
    const token = authorization?.replace("Bearer ", '')

    try{
        const user = await db.collection('sessions').findOne({ token })

        if (!user) {
            return res.status(422).send("voc?? n??o possui permiss??o")
        }
        const home = await db.collection('transactions').find({userId: user.userId}).sort({_id:-1}).toArray()
    
        return res.send(home)

    }catch(err){return res.status(422).send(err.message)}
})

const PORT = process.env.PORT_SERVER;

app.listen(PORT, () => { console.log(`Servidor rodando na porta ${PORT}`) });

