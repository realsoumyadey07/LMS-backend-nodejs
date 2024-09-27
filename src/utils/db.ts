import mongoose from "mongoose";
require("dotenv").config();

const dbUrl: string = process.env.DATABASE_URL || "";

const connectDb = async ()=> {
     try {
          const connectionInstance = await mongoose.connect(dbUrl);
          console.log(`mongodb connected !! DB HOST: ${connectionInstance.connection.host}`);
     } catch (error: any) {
          console.log(error.message);
          setTimeout(connectDb, 5000);
     }
}

export default connectDb;