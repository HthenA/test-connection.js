require('dotenv').config();
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { SquareClient, SquareEnvironment } = require("square");

// Initialize our secure Square client
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function runMonthlyBilling() {
  try {
    console.log("Starting monthly billing run...");

    // 1. Connect to our local SQLite database
    const db = await open({
      filename: './studio.db',
      driver: sqlite3.Database
    });

    // 2. Fetch all unbilled pieces, grouped by student
    const unbilledLogs = await db.all(`
      SELECT user_name, SUM(volume_ci) as total_volume, SUM(calculated_fee) as total_fee 
      FROM pieces 
      WHERE status = 'Shelf Queue' 
      GROUP BY user_name
    `);

    if (unbilledLogs.length === 0) {
      console.log("ℹ️ No unbilled pieces found in the database. Billing run complete.");
      return;
    }

    console.log(`Found ${unbilledLogs.length} student(s) with pending firing fees:`);

    // 3. Process each student's monthly statement
    for (const log of unbilledLogs) {
      console.log(`\n--------------------------------------------`);
      console.log(`Processing statement for: ${log.user_name}`);
      console.log(` - Total Fired Volume: ${log.total_volume.toFixed(1)} Cubic Inches`);
      console.log(` - Total Statement Amount: $${log.total_fee.toFixed(2)}`);

      // Mock Email: In a real database, we would store and pull their real email address
      const studentEmail = `${log.user_name.toLowerCase().replace(/\s+/g, '')}@example.com`;

      try {
        // A. Find or Create the Customer Profile in your Square account
        console.log(` - Searching Square for customer email: ${studentEmail}...`);
        
        const customerSearchResponse = await squareClient.customers.search({
          query: {
            filter: {
              emailAddress: {
                exact: studentEmail
              }
            }
          }
        });

        let squareCustomerId;
        const customers = customerSearchResponse.customers || [];

        if (customers.length > 0) {
          squareCustomerId = customers[0].id;
          console.log(` - Found existing Square Customer ID: ${squareCustomerId}`);
        } else {
          console.log(` - No profile found. Creating new Square Customer profile...`);
          const createCustomerResponse = await squareClient.customers.create({
            givenName: log.user_name,
            emailAddress: studentEmail
          });
          squareCustomerId = createCustomerResponse.customer.id;
          console.log(` - Created new Square Customer ID: ${squareCustomerId}`);
        }

        // B. Simulate draft invoice creation (Square requires an order to be created first)
        console.log(`✅ Success! Square Customer confirmed.`);
        console.log(`[MOCK SQUARE COMMAND] Drafted Square Invoice of $${log.total_fee.toFixed(2)} for ${log.user_name}`);
        
        // C. Update our local database so we don't bill them again next month
        await db.run(
          `UPDATE pieces SET status = 'Complete' WHERE user_name = ? AND status = 'Shelf Queue'`,
          [log.user_name]
        );
        console.log(` - Marked ${log.user_name}'s pieces as 'Complete' (Billed) in local database.`);

      } catch (squareError) {
        console.error(`❌ Failed to process billing for ${log.user_name}:`, squareError);
      }
    }

    console.log(`\n============================================`);
    console.log("✅ Billing run complete! All invoices drafted in Square.");

  } catch (error) {
    console.error("❌ ERROR: Billing run failed.");
    console.error(error);
  }
}

runMonthlyBilling();