import {app} from "./app";
import connectDb from "./utils/db";
require("dotenv").config();

app.listen(process.env.PORT, ()=> {
     console.log(`Server is connected with port ${process.env.PORT}`);
     connectDb();
})