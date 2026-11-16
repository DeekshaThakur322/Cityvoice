import "dotenv/config";
import app from "./app.js";
import { db } from "./db.js";
import { initSlaCron } from "./utils/slaCron.js";

const PORT = process.env.PORT || 5000;
console.log("PORT:", process.env.PORT);
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);


// Connect to DB then start server
const startServer = async()=>{
  try{
    await db();
    app.listen(PORT,()=>{
      console.log(`server is running on port ${PORT}`);
      
    });
  }catch(error){
    console.log("server failed to start",error.message);
    
  }
};
startServer();