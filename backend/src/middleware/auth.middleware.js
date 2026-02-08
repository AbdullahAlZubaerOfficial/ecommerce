import { requireAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;
      console.log("[protectRoute] clerkId:", clerkId);
      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      let user = await User.findOne({ clerkId });
      console.log("[protectRoute] local user found:", !!user);

      // If user is not found in our DB, try to fetch from Clerk and create a local user record
      if (!user) {
        try {
          const resp = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
            headers: {
              Authorization: `Bearer ${ENV.CLERK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          });

          console.log("[protectRoute] Clerk fetch status:", resp.status);

          if (resp.ok) {
            const clerkUser = await resp.json();

            const email =
              clerkUser.primary_email_address?.email_address || clerkUser.email_addresses?.[0]?.email_address || "";
            const name = `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim() || "";
            const imageUrl = clerkUser.image_url || "";

            // create minimal user record
            user = await User.create({
              email: email || `${clerkId}@clerk.local`,
              name: name || "",
              imageUrl,
              clerkId,
            });
            console.log("[protectRoute] Created local user for clerkId:", clerkId, "userId:", user._id);
          } else {
            const text = await resp.text();
            console.warn("[protectRoute] Failed to fetch user from Clerk for clerkId:", clerkId, "status:", resp.status, "body:", text);
          }
        } catch (fetchErr) {
          console.error("[protectRoute] Error fetching user from Clerk:", fetchErr);
        }
      }

      if (!user) return res.status(404).json({ message: "User not found" });

      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
];

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - user not found" });
  }

  if (req.user.email !== ENV.ADMIN_EMAIL) {
    return res.status(403).json({ message: "Forbidden - admin access only" });
  }

  next();
};
