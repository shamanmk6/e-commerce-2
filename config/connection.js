const dotenv=require("dotenv");

dotenv.config();

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
