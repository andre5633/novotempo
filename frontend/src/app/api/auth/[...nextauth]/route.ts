import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

console.log("NextAuth route initialized");
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

