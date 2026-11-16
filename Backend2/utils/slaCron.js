import cron from "node-cron";
import Issue from "../api/modal/issueSchema.js";

/**
 * Background Cron Job: Runs every hour to check for SLA breaches
 * Cron Syntax: '0 * * * *' = at minute 0 of every hour
 */
export const initSlaCron = () => {
  // Run once every hour in the background
  cron.schedule("0 * * * *", async () => {
    console.log(" [CRON WORKER] Running hourly SLA breach check...");

    try {
      const now = new Date();

      // Find open issues whose SLA deadline has passed
      const breachedIssues = await Issue.find({
        status: { $in: ["Reported", "Under-Review"] },
        slaDeadline: { $lt: now },
      });

      if (breachedIssues.length === 0) {
        console.log(" [CRON WORKER] No SLA breaches found. All on track!");
        return;
      }

      console.log(
        ` [CRON WORKER] Found ${breachedIssues.length} issues that breached SLA! Escalating...`
      );

      // Auto-escalate each breached issue and update timeline
      for (const issue of breachedIssues) {
        issue.status = "Escalated";
        issue.timeline.push({
          status: "Escalated",
          comment: "SLA Resolution Deadline Breached (48h). Automatically escalated to Zonal Commissioner.",
          timestamp: now,
        });
        await issue.save();
      }

      console.log(`[CRON WORKER] Successfully escalated ${breachedIssues.length} issues.`);
    } catch (error) {
      console.error(" [CRON WORKER ERROR]:", error.message);
    }
  });

  console.log("Autonomous SLA Escalation Cron Worker initialized!");
};