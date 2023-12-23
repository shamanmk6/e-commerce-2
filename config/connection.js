const dotenv=require("dotenv");

dotenv.config();
// console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
// console.log(`MONGODB_PASSWORD: ${process.env.MONGODB_PASSWORD}`);
const password = process.env.MONGODB_PASSWORD;
const encodedPassword = encodeURIComponent(password);
// console.log(`Encoded Password: ${encodedPassword}`);
const MONGODB_URI = `mongodb+srv://mohammedshaman83:${encodedPassword}@cluster0.n6vhi2p.mongodb.net/?retryWrites=true&w=majority`;  
// console.log(`MongoDB URI: ${MONGODB_URI}`);

const uri =process.env.MONGODB_URI;
console.log(uri);



const { MongoClient } = require("mongodb");
const client = new MongoClient(uri);
const dbname = "shopping";



module.exports = {
  connectToDatabase: async () => {
    try {
      await client.connect();
      console.log(`Connected to the ${dbname} database successfully`);
    } catch (err) {
      console.log(`Error in connecting to the database: ${err}`);
    }
  },
  getDatabase: () => {
    return client.db(dbname);
  },
};
