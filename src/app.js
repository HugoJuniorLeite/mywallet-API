import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb";
import dotenv from "dotenv"
import joi from 'joi'


dotenv.config();

const app =express();

app.use(cors());
app.use(express.json());

 const mongoClient = new MongoClient(process.env.REACT_APP_API_URL)
 let db

 mongoClient.connect()
 .then(() =>{
     db = mongoClient.db()
 })

 app.post("/", async (req,res)=>{
const {email, password} =req.headers

console.log(email,"email")
console.log(password,"password")

const userSchema =joi.object({
    email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'br'] } }).required(),
    password: joi.string().min(6).max(18).required()
})

try{

const validation = userSchema.validate({email, password}, {abortEarly: false})
if(validation.error){
    const errors = validation.error.details.map((detail)=> detail.message);
    return res.status(422).send(errors)
}
    
    await db.collection("users").insertOne({
        email:email,
        password:password
    })

    return res.sendStatus(201)

} catch(err){return res.status(500).send(err.massage)}

 } )

const PORT = process.env.PORT_SERVER

app.listen(PORT, ()=>{ console.log(`Servidor rodando na porta ${PORT}`)})