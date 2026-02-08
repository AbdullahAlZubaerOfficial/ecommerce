import { User } from "../models/user.model.js";
import { connectDB } from "../config/db.js";
import { ENV } from "../config/env.js";

const syncAdmin = async () => {
    try {
        await connectDB();
        console.log("Connected to DB");

        const adminEmail = ENV.ADMIN_EMAIL;
        if (!adminEmail) {
            console.error("ADMIN_EMAIL not defined in env");
            process.exit(1);
        }

        console.log(`Fetching Clerk user for email: ${adminEmail}...`);

        // Fetch user from Clerk API
        const clerkResponse = await fetch(`https://api.clerk.com/v1/users?email_address=${adminEmail}`, {
            headers: {
                Authorization: `Bearer ${ENV.CLERK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        });

        if (!clerkResponse.ok) {
            console.error("Failed to fetch user from Clerk:", await clerkResponse.text());
            process.exit(1);
        }

        const clerkUsers = await clerkResponse.json();

        if (clerkUsers.length === 0) {
            console.error("No user found in Clerk with this email.");
            process.exit(1);
        }

        const clerkUser = clerkUsers[0];
        const clerkId = clerkUser.id;
        const name = `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim() || "Admin";
        const imageUrl = clerkUser.image_url;

        console.log(`Found Clerk User: ${clerkId}, Name: ${name}`);

        // Update or Create User in MongoDB
        const user = await User.findOneAndUpdate(
            { email: adminEmail },
            {
                name,
                imageUrl,
                clerkId,
                email: adminEmail
            },
            { upsert: true, new: true }
        );

        console.log("Admin user synced successfully:", user);
        process.exit(0);

    } catch (error) {
        console.error("Error syncing admin:", error);
        process.exit(1);
    }
};

syncAdmin();
