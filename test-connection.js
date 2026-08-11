require('dotenv').config();
const { SquareClient, SquareEnvironment } = require("square");

// Initialize the Square client using the new v40+ SDK format
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function runTest() {
  try {
    console.log("Attempting to connect to Square Sandbox...");
    
    // Call the updated locations listing method
    const response = await squareClient.locations.list();
    const locations = response.locations || [];
    
    console.log("✅ SUCCESS! Connected to Square.");
    console.log(`Your Sandbox has ${locations.length} active location(s):`);
    locations.forEach(loc => console.log(` - ${loc.name} (ID: ${loc.id})`));
  } catch (error) {
    console.error("❌ ERROR: Failed to connect to Square.");
    console.error(error);
  }
}

runTest();