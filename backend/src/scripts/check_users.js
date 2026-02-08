import { User } from "../models/user.model.js";
import { connectDB } from "../config/db.js";
import { ENV } from "../config/env.js";

const checkUsers = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        const users = await User.find({});
        console.log(`Found ${users.length} users`);

        const admin = users.find(u => u.email === ENV.ADMIN_EMAIL);
        if (admin) {
            console.log("Admin user found:", admin.email, admin._id);
            console.log("Clerk ID:", admin.clerkId);
        } else {
            console.log("Admin user NOT found with email:", ENV.ADMIN_EMAIL);
            console.log("Existing emails:", users.map(u => u.email));
        }

        process.exit(0);
    } catch (error) {
        console.error("Error checking users:", error);
        process.exit(1);
    }
};

checkUsers();
