import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Probing for undocumented tables...");
  
  const tables = ["messages", "chats", "notifications", "conversations", "chat_messages"];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error && error.code === "PGRST116") {
      // Single row query error or table exists but empty
      console.log(`Table "${table}": Exists!`);
    } else if (error && error.code === "42P01") {
      console.log(`Table "${table}": Does not exist.`);
    } else if (error) {
      console.log(`Table "${table}": Error code: ${error.code} | Message: ${error.message}`);
    } else {
      console.log(`Table "${table}": Exists!`);
    }
  }
}

run();
