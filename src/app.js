import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb";
import dotenv from "dotenv"

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


const PORT = process.env.PORT_SERVER

app.listen(PORT, ()=>{ console.log(`Servidor rodando na porta ${PORT}`)})